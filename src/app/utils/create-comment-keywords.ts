import { Language, LanguagetoolResult, LanguagetoolService } from '../services/http/languagetool.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SpacyKeyword, SpacyService } from '../services/http/spacy.service';
import { DeepLService, FormalityType, SourceLang, TargetLang } from '../services/http/deep-l.service';
import { Comment, Language as CommentLanguage } from '../models/comment';
import { ViewCommentDataComponent } from '../components/shared/view-comment-data/view-comment-data.component';
import { CURRENT_SUPPORTED_LANGUAGES, Model } from '../services/http/spacy.interface';

export enum KeywordsResultType {
  successful,
  badSpelled,
  languageNotSupported,
  failure
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

export class CreateCommentKeywords {

  static isKeywordAcceptable(keyword: string): boolean {
    const regex = /(^[ -@\[-`{-~]+$)/g;
    return keyword.match(regex) === null && keyword.length > 2;
  }

  static removeMarkdown(text: string): string {
    return text.replace(/([*_~]+(?=[^*_~\s]))|(^[ \t]*#+ )|(^[ \t]*>[> ]*)|(`+)/gm, '')
      .replace(/([^*_~\s])[*_~]+/gm, '$1')
      .replace(/\[([^\n\[\]]*)\]\(([^()\n]*)\)/gm, '$1 $2');
  }

  public static generateDeeplDelta(deepl: DeepLService, body: string, targetLang: TargetLang,
                                   formality = FormalityType.less): Observable<[string, string]> {
    const delta = ViewCommentDataComponent.getDeltaFromData(body);
    const xml = delta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] === 'string' && e['insert'].trim().length) {
        acc += '<x i="' + i + '">' + this.encodeHTML(CreateCommentKeywords.removeMarkdown(e['insert'])) + '</x>';
        e['insert'] = '';
      }
      return acc;
    }, '');
    return deepl.improveTextStyle(xml, targetLang, formality).pipe(
      map(str => {
        const regex = /<x i="(\d+)">([^<]+)<\/x>/gm;
        let m;
        while ((m = regex.exec(str)) !== null) {
          delta.ops[+m[1]]['insert'] += this.decodeHTML(m[2]);
        }
        const text = delta.ops.reduce((acc, el) => acc + (typeof el['insert'] === 'string' ? el['insert'] : ''), '');
        return [ViewCommentDataComponent.getDataFromDelta(delta), text];
      })
    );
  }

  static generateKeywords(languagetoolService: LanguagetoolService,
                          deeplService: DeepLService,
                          spacyService: SpacyService,
                          body: string,
                          useDeepl: boolean = false,
                          language: Language = 'auto'): Observable<KeywordsResult> {
    const text = ViewCommentDataComponent.getTextFromData(body);
    return languagetoolService.checkSpellings(text, language).pipe(
      switchMap(result => this.spacyKeywordsFromLanguagetoolResult(languagetoolService, deeplService,
        spacyService, text, body, language, result, useDeepl)),
      catchError((err) => of({
        keywords: [],
        language: CommentLanguage.auto,
        resultType: KeywordsResultType.failure,
        error: err
      } as KeywordsResult))
    );
  }

  private static spacyKeywordsFromLanguagetoolResult(languagetoolService: LanguagetoolService,
                                                     deeplService: DeepLService,
                                                     spacyService: SpacyService,
                                                     text: string,
                                                     body: string,
                                                     selectedLanguage: Language,
                                                     result: LanguagetoolResult,
                                                     useDeepl: boolean): Observable<KeywordsResult> {
    const wordCount = text.trim().split(' ').length;
    const hasConfidence = selectedLanguage === 'auto' ? result.language.detectedLanguage.confidence >= 0.5 : true;
    const errorQuotient = (result.matches.length * 100) / wordCount;
    if (!hasConfidence ||
      errorQuotient > ERROR_QUOTIENT_USE_DEEPL ||
      (!useDeepl && errorQuotient > ERROR_QUOTIENT_WELL_SPELLED)) {
      return of({
        keywords: [],
        language: CommentLanguage.auto,
        resultType: KeywordsResultType.badSpelled
      } as KeywordsResult);
    }
    const escapedText = this.escapeForSpacy(text);
    let textLangObservable = of(escapedText);
    if (useDeepl && errorQuotient > ERROR_QUOTIENT_WELL_SPELLED) {
      let target = TargetLang.EN_US;
      const code = result.language.detectedLanguage.code.toUpperCase().split('-')[0];
      if (code.startsWith(SourceLang.EN)) {
        target = TargetLang.DE;
      }
      textLangObservable = this.generateDeeplDelta(deeplService, body, target)
        .pipe(
          map(([_, improvedText]) => this.escapeForSpacy(improvedText))
        );
    }
    return textLangObservable.pipe(
      switchMap((textForSpacy) => this.callSpacy(spacyService, textForSpacy,
        languagetoolService.isSupportedLanguage(result.language.code as Language), selectedLanguage,
        languagetoolService.mapLanguageToSpacyModel(result.language.code as Language)))
    );
  }

  private static callSpacy(spacyService: SpacyService,
                           text: string,
                           isResultLangSupported: boolean,
                           selectedLanguage: Language,
                           commentModel: Model): Observable<KeywordsResult> {
    const selectedLangExtend =
      selectedLanguage[2] === '-' ? selectedLanguage.substr(0, 2) : selectedLanguage;
    let finalLanguage: CommentLanguage;
    if (selectedLanguage === 'auto') {
      finalLanguage = Comment.mapModelToLanguage(commentModel);
    } else if (CommentLanguage[selectedLangExtend]) {
      finalLanguage = CommentLanguage[selectedLangExtend];
    }
    if (!isResultLangSupported || !CURRENT_SUPPORTED_LANGUAGES.includes(commentModel)) {
      return of({
        keywords: [],
        language: finalLanguage,
        resultType: KeywordsResultType.languageNotSupported
      } as KeywordsResult);
    }
    return spacyService.getKeywords(text, commentModel).pipe(
      map(keywords => ({
        keywords,
        language: finalLanguage,
        resultType: KeywordsResultType.successful
      } as KeywordsResult)),
      catchError(err => of({
        keywords: [],
        language: finalLanguage,
        resultType: KeywordsResultType.failure,
        error: err,
        wasSpacyError: true
      } as KeywordsResult))
    );
  }

  private static escapeForSpacy(text: string): string {
    text = this.makeCapslockLowercase(text);
    return text.replace(/\(([^-\s)]+-)\)([^\s]+)/gmi, '$1$2');
  }

  private static makeCapslockLowercase(text: string): string {
    const upperText = text.toUpperCase();
    const regex = /\s+|$/gmi;
    let m: RegExpExecArray;
    let result = '';
    let lastAddedIndex = 0;
    while ((m = regex.exec(upperText)) !== null) {
      const str = text.substring(lastAddedIndex, m.index);
      if (m.index - lastAddedIndex >= 2 && str === upperText.substring(lastAddedIndex, m.index)) {
        result += str.toLowerCase();
      } else {
        result += str;
      }
      result += text.substring(m.index, regex.lastIndex);
      lastAddedIndex = regex.lastIndex;
      if (regex.lastIndex === m.index) {
        regex.lastIndex++;
      }
    }
    return result;
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
}
