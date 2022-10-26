import {
  Language,
  LanguagetoolResult,
  LanguagetoolService,
} from '../services/http/languagetool.service';
import {
  DeepLService,
  FormalityType,
  SourceLang,
  TargetLang,
} from '../services/http/deep-l.service';
import { SpacyKeyword, SpacyService } from '../services/http/spacy.service';
import { Observable, of, throwError } from 'rxjs';
import { Comment, Language as CommentLanguage } from '../models/comment';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Model } from '../services/http/spacy.interface';
import {
  ImmutableStandardDelta,
  QuillUtils,
  StandardDelta,
} from './quill-utils';
import { SharedTextFormatting } from './shared-text-formatting';
import { RoomDataService } from '../services/util/room-data.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../services/util/notification.service';
import { SpacyDialogComponent } from '../components/shared/_dialogs/spacy-dialog/spacy-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export enum KeywordsResultType {
  Successful,
  BadSpelled,
  LanguageNotSupported,
  Failure,
}

export interface KeywordsResult {
  keywords: SpacyKeyword[];
  language: CommentLanguage;
  resultType: KeywordsResultType;
  error?: any;
  wasSpacyError?: boolean;
  wasDeepLError?: boolean;
}

export interface CommentCreateOptions {
  body: StandardDelta;
  tag: string;
  questionerName: string;
  userId: string;
  commentReference?: string;
  isModerator: boolean;
  isBrainstorming: boolean;
  selectedLanguage: Language;
  hadUsedDeepL: boolean;
  callbackFinished?: () => void;
}

const ERROR_QUOTIENT_WELL_SPELLED = 20;
const ERROR_QUOTIENT_USE_DEEPL = 75;

export class KeywordExtractor {
  constructor(
    private dialog: MatDialog,
    private translateService: TranslateService,
    private notification: NotificationService,
    private roomDataService: RoomDataService,
    private languagetoolService: LanguagetoolService,
    private spacyService: SpacyService,
    private deeplService: DeepLService,
  ) {}

  static isKeywordAcceptable(keyword: string): boolean {
    const regex = /^[ -\/:-@\[-`{-~]+$/g;
    // accept only if some normal characters are present
    return keyword.match(regex) === null && keyword.length > 2;
  }

  private static escapeForSpacy(text: string): string {
    text = this.makeCapslockLowercase(text);
    // Removes parentheses from words: (Kinder-)Wagen => Kinder-Wagen
    return text.replace(/\(([^-\s)]+-)\)\s*(\S+)/gim, '$1$2');
  }

  private static makeCapslockLowercase(text: string): string {
    return text.replace(/\S+/g, (k) => {
      if (k.replace(/\d+/g, '').length < 4) {
        return k;
      }
      return k.toUpperCase() === k ? k.toLowerCase() : k;
    });
  }

  createPlainComment(options: CommentCreateOptions) {
    const comment = new Comment();
    comment.body = QuillUtils.transformURLtoQuillLink(
      options.body,
      options.isModerator,
    );
    comment.tag = options.tag;
    comment.questionerName = options.questionerName;
    comment.roomId = this.roomDataService.sessionService.currentRoom.id;
    comment.creatorId = options.userId;
    comment.createdFromLecturer = options.isModerator;
    comment.brainstormingQuestion = options.isBrainstorming;
    comment.commentReference = options.commentReference;
    return comment;
  }

  createCommentInteractive(options: CommentCreateOptions): Observable<Comment> {
    const comment = this.createPlainComment(options);
    if (options.isBrainstorming) {
      return this.generateBrainstormingTerm(
        options.body,
        options.selectedLanguage,
      ).pipe(
        switchMap((result) => {
          options.callbackFinished?.();
          if (this.wasWritten(result.keywords[0].text, options.userId)) {
            this.translateService
              .get('comment-page.error-brainstorm-duplicate')
              .subscribe((msg) => this.notification.show(msg));
            return throwError(
              () => new Error('Brainstorming idea already written'),
            );
          }
          comment.language = result.language;
          comment.keywordsFromSpacy = result.keywords;
          comment.keywordsFromQuestioner = [];
          return of(comment);
        }),
      );
    }
    return this.generateKeywords(
      options.body,
      options.hadUsedDeepL,
      options.selectedLanguage,
    ).pipe(
      switchMap((result) => {
        options.callbackFinished?.();
        comment.language = result.language;
        comment.keywordsFromSpacy = result.keywords;
        comment.keywordsFromQuestioner = [];
        return this.openSpacyDialog(comment, result);
      }),
    );
  }

  generateBrainstormingTerm(
    body: ImmutableStandardDelta,
    language: Language = 'auto',
  ): Observable<KeywordsResult> {
    const text = QuillUtils.getTextFromDelta(body);
    const term = SharedTextFormatting.getTerm(text);
    return this.languagetoolService.checkSpellings(text, language).pipe(
      switchMap((result) => {
        const lang = result.language.code as Language;
        const isSupported = this.languagetoolService.isSupportedLanguage(lang);
        const commentModel =
          this.languagetoolService.mapLanguageToSpacyModel(lang);
        const finalLanguage = Comment.mapModelToLanguage(commentModel);
        const hasConfidence =
          language === 'auto'
            ? result.language.detectedLanguage.confidence >= 0.5
            : true;
        //TO-DO: Adapt spacy service
        const spacyNotUpdated = true;
        if (!isSupported || spacyNotUpdated) {
          return of({
            keywords: [
              {
                text: term,
                dep: ['ROOT'],
              },
            ],
            language: hasConfidence ? finalLanguage : CommentLanguage.AUTO,
            resultType: KeywordsResultType.LanguageNotSupported,
          });
        }
        if (!hasConfidence) {
          return of({
            keywords: [
              {
                text: term,
                dep: ['ROOT'],
              },
            ],
            language: finalLanguage,
            resultType: KeywordsResultType.BadSpelled,
          });
        }
        return this.spacyService.getKeywords(term, commentModel, true).pipe(
          map(
            (keywords) =>
              ({
                keywords: [
                  {
                    text: keywords.map((kw) => kw.text).join(' '),
                    dep: ['ROOT'],
                  },
                ],
                language: finalLanguage,
                resultType: KeywordsResultType.Successful,
              } as KeywordsResult),
          ),
          catchError((err) =>
            of({
              keywords: [
                {
                  text: term,
                  dep: ['ROOT'],
                },
              ],
              language: finalLanguage,
              resultType: KeywordsResultType.Failure,
              error: err,
              wasSpacyError: true,
            } as KeywordsResult),
          ),
        );
      }),
      catchError((err) =>
        of({
          keywords: [
            {
              text: term,
              dep: ['ROOT'],
            },
          ],
          language: CommentLanguage.AUTO,
          resultType: KeywordsResultType.Failure,
          error: err,
        } as KeywordsResult),
      ),
    );
  }

  generateKeywords(
    body: ImmutableStandardDelta,
    hadUsedDeepL: boolean = false,
    language: Language = 'auto',
  ): Observable<KeywordsResult> {
    const text = QuillUtils.getTextFromDelta(body).trim();
    return this.languagetoolService.checkSpellings(text, language).pipe(
      switchMap((result) =>
        this.spacyKeywordsFromLanguagetoolResult(
          text,
          body,
          language,
          result,
          hadUsedDeepL,
        ),
      ),
      catchError((err) =>
        of({
          keywords: [],
          language: CommentLanguage.AUTO,
          resultType: KeywordsResultType.Failure,
          error: err,
        } as KeywordsResult),
      ),
    );
  }

  private spacyKeywordsFromLanguagetoolResult(
    text: string,
    body: ImmutableStandardDelta,
    selectedLanguage: Language,
    result: LanguagetoolResult,
    hadUsedDeepL: boolean,
  ): Observable<KeywordsResult> {
    const lang = result.language.code as Language;
    const isSupported = this.languagetoolService.isSupportedLanguage(lang);
    const commentModel = this.languagetoolService.mapLanguageToSpacyModel(lang);
    const finalLanguage = Comment.mapModelToLanguage(commentModel);
    const hasConfidence =
      selectedLanguage === 'auto'
        ? result.language.detectedLanguage.confidence >= 0.5
        : true;
    if (!isSupported) {
      return of({
        keywords: [],
        language: hasConfidence ? finalLanguage : CommentLanguage.AUTO,
        resultType: KeywordsResultType.LanguageNotSupported,
      });
    }
    const wordCount = text.match(/\S+/g)?.length || 0;
    const errorQuotient = (result.matches.length * 100) / wordCount;
    /*
    If no confidence, too many errors for DeepL or DeepL were used and there are still too many errors:
    Return bad spelled
     */
    if (
      !hasConfidence ||
      errorQuotient > ERROR_QUOTIENT_USE_DEEPL ||
      (hadUsedDeepL && errorQuotient > ERROR_QUOTIENT_WELL_SPELLED)
    ) {
      return of({
        keywords: [],
        language: CommentLanguage.AUTO,
        resultType: KeywordsResultType.BadSpelled,
      } as KeywordsResult);
    }
    // not many errors, forward to spacy
    if (errorQuotient <= ERROR_QUOTIENT_WELL_SPELLED) {
      return this.callSpacy(text, finalLanguage, commentModel);
    }
    // error quotient higher than well spelled, implies that no deepl was used
    let target = TargetLang.EN_US;
    const code = result.language.detectedLanguage.code
      .split('-', 1)[0]
      .toUpperCase();
    if (code === SourceLang.EN) {
      target = TargetLang.DE;
    }
    return this.deeplService.improveDelta(body, target, FormalityType.Less).pipe(
      switchMap(([_, improvedText]) =>
        this.callSpacy(improvedText.trim(), finalLanguage, commentModel),
      ),
      catchError((err) =>
        of({
          keywords: [],
          language: finalLanguage,
          resultType: KeywordsResultType.Failure,
          error: err,
          wasDeepLError: true,
        } as KeywordsResult),
      ),
    );
  }

  private callSpacy(
    text: string,
    finalLanguage: string,
    commentModel: Model,
  ): Observable<KeywordsResult> {
    const escapedText = KeywordExtractor.escapeForSpacy(text);
    return this.spacyService.getKeywords(escapedText, commentModel, false).pipe(
      map(
        (keywords) =>
          ({
            keywords,
            language: finalLanguage,
            resultType: KeywordsResultType.Successful,
          } as KeywordsResult),
      ),
      catchError((err) =>
        of({
          keywords: [],
          language: finalLanguage,
          resultType: KeywordsResultType.Failure,
          error: err,
          wasSpacyError: true,
        } as KeywordsResult),
      ),
    );
  }

  private openSpacyDialog(
    comment: Comment,
    keywordResult: KeywordsResult,
  ): Observable<Comment> {
    const dialogRef = this.dialog.open(SpacyDialogComponent, {
      data: {
        result: keywordResult,
        comment,
      },
    });
    return dialogRef.afterClosed().pipe(
      switchMap((result) => {
        if (!result?.comment) {
          return throwError(() => new Error('No Comment provided'));
        }
        return of(result.comment);
      }),
    );
  }

  private wasWritten(term: string, userId: string): boolean {
    if (!this.roomDataService.dataAccessor.currentRawComments()) {
      return true;
    }
    const areEqual = (str1: string, str2: string): boolean =>
      str1.localeCompare(str2, undefined, { sensitivity: 'base' }) === 0;
    return this.roomDataService.dataAccessor
      .currentRawComments()
      .some(
        (comment) =>
          comment.brainstormingQuestion &&
          comment.creatorId === userId &&
          comment.keywordsFromSpacy?.some((kw) => areEqual(kw.text, term)),
      );
  }
}
