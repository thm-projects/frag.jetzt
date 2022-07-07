import { Language, LanguagetoolResult, LanguagetoolService } from '../services/http/languagetool.service';
import { DeepLService, FormalityType, SourceLang, TargetLang } from '../services/http/deep-l.service';
import { SpacyKeyword, SpacyService } from '../services/http/spacy.service';
import { Observable, of } from 'rxjs';
import { Comment, Language as CommentLanguage } from '../models/comment';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Model } from '../services/http/spacy.interface';
import { ImmutableStandardDelta, QuillUtils, StandardDelta } from './quill-utils';
import { clone } from './ts-utils';

export enum KeywordsResultType {
  Successful,
  BadSpelled,
  LanguageNotSupported,
  Failure
}

export interface KeywordsResult {
  keywords: SpacyKeyword[];
  language: CommentLanguage;
  resultType: KeywordsResultType;
  error?: any;
  wasSpacyError?: boolean;
}

const ERROR_QUOTIENT_WELL_SPELLED = 20;
const ERROR_QUOTIENT_USE_DEEPL = 75;

export class KeywordExtractor {
  constructor(
    private languagetoolService: LanguagetoolService,
    private spacyService: SpacyService,
    private deeplService: DeepLService,
  ) {
  }

  static removeMarkdown(text: string): string {
    // remove emphasis elements before (*_~), heading (#) and quotation (>)
    return text.replace(/([*_~]+(?=[^*_~\s]))|(^[ \t]*#+ )|(^[ \t]*>[> ]*)/gm, '')
      // remove code blocks (`)
      .replace(/(`+)/g, '')
      // remove emphasis elements after (*_~)
      .replace(/([^*_~\s])[*_~]+/gm, '$1')
      // replace links
      .replace(/\[([^\n\[\]]*)\]\(([^()\n]*)\)/gm, '$1 $2');
  }

  static isKeywordAcceptable(keyword: string): boolean {
    const regex = /^[ -\/:-@\[-`{-~]+$/g;
    // accept only if some normal characters are present
    return keyword.match(regex) === null && keyword.length > 2;
  }

  private static escapeForSpacy(text: string): string {
    text = this.makeCapslockLowercase(text);
    // Removes parentheses from words: (Kinder-)Wagen => Kinder-Wagen
    return text.replace(/\(([^-\s)]+-)\)\s*(\S+)/gmi, '$1$2');
  }

  private static makeCapslockLowercase(text: string): string {
    return text.replace(/\S+/g, (k) => {
      if (k.replace(/\d+/g, '').length < 4) {
        return k;
      }
      return k.toUpperCase() === k ? k.toLowerCase() : k;
    });
  }

  private static generateBrainstormingWords(text: string): SpacyKeyword[] {
    return KeywordExtractor.escapeForSpacy(text).split(/\s+/g).filter(e => e.length).map(newText => ({
      dep: ['ROOT'],
      text: newText
    }));
  }

  private static encodeHTML(str: string): string {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static decodeHTML(str: string): string {
    return str.replace(/&apos;/g, '\'')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  generateDeeplDelta(
    body: ImmutableStandardDelta, targetLang: TargetLang, formality = FormalityType.Less
  ): Observable<[StandardDelta, string]> {
    let isMark = false;
    const skipped = [];
    const newDelta: StandardDelta = clone(body);
    const xml = newDelta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] !== 'string') {
        skipped.push(i);
        return acc;
      }
      const text = KeywordExtractor.encodeHTML(KeywordExtractor.removeMarkdown(e['insert']));
      acc += isMark ? '<x>' + text + '</x>' : text;
      e['insert'] = '';
      isMark = !isMark;
      return acc;
    }, '');
    return this.deeplService.improveTextStyle(xml, targetLang, formality).pipe(
      map(str => {
        let index = 0;
        const nextStr = (textStr: string) => {
          while (skipped[0] === index) {
            skipped.splice(0, 1);
            index++;
          }
          if (index >= newDelta.ops.length) {
            return;
          }
          newDelta.ops[index++]['insert'] = KeywordExtractor.decodeHTML(textStr);
        };
        const regex = /<x>([^<]*)<\/x>/g;
        let m;
        let start = 0;
        while ((m = regex.exec(str)) !== null) {
          nextStr(str.substring(start, m.index));
          nextStr(m[1]);
          start = m.index + m[0].length;
        }
        nextStr(str.substring(start));
        return [newDelta, QuillUtils.getTextFromDelta(body)];
      })
    );
  }

  generateKeywords(
    body: ImmutableStandardDelta, brainstorming: boolean, useDeepl: boolean = false, language: Language = 'auto'
  ): Observable<KeywordsResult> {
    const text = QuillUtils.getTextFromDelta(body).trim();
    return this.languagetoolService.checkSpellings(text, language).pipe(
      switchMap(result => this.spacyKeywordsFromLanguagetoolResult(
        text, body, language, result, useDeepl, brainstorming
      )),
      catchError((err) => of({
        keywords: [],
        language: CommentLanguage.AUTO,
        resultType: KeywordsResultType.Failure,
        error: err
      } as KeywordsResult))
    );
  }

  private spacyKeywordsFromLanguagetoolResult(
    text: string,
    body: ImmutableStandardDelta,
    selectedLanguage: Language,
    result: LanguagetoolResult,
    hadUsedDeepL: boolean,
    brainstorming: boolean
  ): Observable<KeywordsResult> {
    const lang = result.language.code as Language;
    const isSupported = this.languagetoolService.isSupportedLanguage(lang);
    const commentModel = this.languagetoolService.mapLanguageToSpacyModel(lang);
    const finalLanguage = Comment.mapModelToLanguage(commentModel);
    if (!isSupported) {
      return of({
        keywords: brainstorming ? KeywordExtractor.generateBrainstormingWords(text) : [],
        language: finalLanguage,
        resultType: brainstorming ? KeywordsResultType.Successful : KeywordsResultType.LanguageNotSupported,
      });
    }
    if (brainstorming) {
      return this.callSpacy(text, finalLanguage, commentModel, true);
    }
    const wordCount = text.match(/\S+/g)?.length || 0;
    const hasConfidence = selectedLanguage === 'auto' ? result.language.detectedLanguage.confidence >= 0.5 : true;
    const errorQuotient = (result.matches.length * 100) / wordCount;
    /*
    If no confidence, too many errors for DeepL or DeepL were used and there are still too many errors:
    Return bad spelled
     */
    if (!hasConfidence || errorQuotient > ERROR_QUOTIENT_USE_DEEPL ||
      (hadUsedDeepL && errorQuotient > ERROR_QUOTIENT_WELL_SPELLED)) {
      return of({
        keywords: [],
        language: CommentLanguage.AUTO,
        resultType: KeywordsResultType.BadSpelled,
      } as KeywordsResult);
    }
    // not many errors, forward to spacy
    if (errorQuotient <= ERROR_QUOTIENT_WELL_SPELLED) {
      return this.callSpacy(text, finalLanguage, commentModel, false);
    }
    let target = TargetLang.EN_US;
    const code = result.language.detectedLanguage.code.split('-', 1)[0].toUpperCase();
    if (code === SourceLang.EN) {
      target = TargetLang.DE;
    }
    this.generateDeeplDelta(body, target).pipe(
      switchMap(([_, improvedText]) =>
        this.callSpacy(improvedText, finalLanguage, commentModel, false)),
    );
  }

  private callSpacy(
    text: string,
    finalLanguage: string,
    commentModel: Model,
    brainstorming: boolean
  ): Observable<KeywordsResult> {
    const escapedText = KeywordExtractor.escapeForSpacy(text);
    return this.spacyService.getKeywords(escapedText, commentModel, brainstorming).pipe(
      map(keywords => ({
        keywords,
        language: finalLanguage,
        resultType: KeywordsResultType.Successful,
      } as KeywordsResult)),
      catchError(err => of({
        keywords: [],
        language: finalLanguage,
        resultType: KeywordsResultType.Failure,
        error: err,
        wasSpacyError: true,
      } as KeywordsResult)),
    );
  }
}
