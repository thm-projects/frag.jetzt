import {
  Language,
  LanguagetoolResult,
  LanguagetoolService,
} from '../services/http/languagetool.service';
import { DeepLService } from '../services/http/deep-l.service';
import { SpacyKeyword, SpacyService } from '../services/http/spacy.service';
import { Observable, of, throwError } from 'rxjs';
import { Comment, Language as CommentLanguage } from '../models/comment';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Model } from '../services/http/spacy.interface';
import { SharedTextFormatting } from './shared-text-formatting';
import { RoomDataService } from '../services/util/room-data.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../services/util/notification.service';
import { SpacyDialogComponent } from '../components/shared/_dialogs/spacy-dialog/spacy-dialog.component';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { Injector } from '@angular/core';
import { UUID } from './ts-utils';
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
  error?: unknown;
  wasSpacyError?: boolean;
  wasDeepLError?: boolean;
}

export interface CommentCreateOptions {
  body: string;
  tag: string;
  questionerName: string;
  userId: UUID;
  commentReference?: UUID;
  isModerator: boolean;
  brainstormingSessionId: UUID;
  brainstormingLanguage: string;
  selectedLanguage: Language;
  hadUsedDeepL: boolean;
  keywordExtractionActive: boolean;
  ignoreKeywordFailure?: boolean;
  callbackFinished?: () => void;
}

const ERROR_QUOTIENT_WELL_SPELLED = 20;
const ERROR_QUOTIENT_USE_DEEPL = 75;

export class KeywordExtractor {
  constructor(
    injector: Injector,
    private dialog: MatDialog = injector.get(MatDialog),
    private translateService: TranslateService = injector.get(TranslateService),
    private notification: NotificationService = injector.get(
      NotificationService,
    ),
    private roomDataService: RoomDataService = injector.get(RoomDataService),
    private languagetoolService: LanguagetoolService = injector.get(
      LanguagetoolService,
    ),
    private spacyService: SpacyService = injector.get(SpacyService),
    private deeplService: DeepLService = injector.get(DeepLService),
    private brainstormingService: BrainstormingService = injector.get(
      BrainstormingService,
    ),
  ) {}

  static isKeywordAcceptable(keyword: string): boolean {
    const regex = /^[ -/:-@[-`{-~]+$/g;
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
    return new Comment({
      body: options.body,
      tag: options.tag,
      questionerName: options.questionerName,
      roomId: this.roomDataService.sessionService.currentRoom.id,
      creatorId: options.userId,
      commentReference: options.commentReference,
      brainstormingSessionId: options.brainstormingSessionId || null,
    });
  }

  createCommentInteractive(options: CommentCreateOptions): Observable<Comment> {
    const comment = this.createPlainComment(options);
    if (options.brainstormingSessionId !== null) {
      return this.generateBrainstormingTerm(
        options.body,
        options.brainstormingSessionId,
        options.brainstormingLanguage,
      ).pipe(
        switchMap((result) => {
          options.callbackFinished?.();
          if (
            this.wasWritten(
              result.id,
              options.userId,
              options.brainstormingSessionId,
            )
          ) {
            this.translateService
              .get('comment-page.error-brainstorm-duplicate')
              .subscribe((msg) => this.notification.show(msg));
            return throwError(
              () => new Error('Brainstorming idea already written'),
            );
          }
          comment.language = (
            options.brainstormingLanguage || 'AUTO'
          ).toUpperCase() as CommentLanguage;
          comment.keywordsFromSpacy = [];
          comment.keywordsFromQuestioner = [];
          comment.brainstormingWordId = result.id;
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
        if (
          !options.keywordExtractionActive ||
          (options.ignoreKeywordFailure && !result.keywords?.length)
        ) {
          return of(comment);
        }
        return this.openSpacyDialog(comment, result);
      }),
    );
  }

  generateBrainstormingTerm(
    body: string,
    sessionId: string,
    language: string,
  ): Observable<BrainstormingWord> {
    const text = body;
    const term = SharedTextFormatting.getTerm(text);
    return this.spacyService.getLemma(term, language as Model).pipe(
      catchError((err) => {
        console.error(err);
        return of({ text: term } as const);
      }),
      switchMap((obj) =>
        this.brainstormingService.createWord(sessionId, obj.text),
      ),
    );
  }

  generateKeywords(
    body: string,
    hadUsedDeepL: boolean = false,
    language: Language = 'auto',
  ): Observable<KeywordsResult> {
    const text = body.trim();
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
    body: string,
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
    return this.deeplService.improveDelta(body).pipe(
      switchMap(([, improvedText]) =>
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
          }) as KeywordsResult,
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

  private wasWritten(
    wordId: string,
    userId: string,
    sessionId: string,
  ): boolean {
    if (!this.roomDataService.dataAccessor.currentRawComments()) {
      return true;
    }
    return this.roomDataService.dataAccessor
      .currentRawComments()
      .some(
        (comment) =>
          comment.brainstormingSessionId === sessionId &&
          comment.creatorId === userId &&
          comment.brainstormingWordId === wordId,
      );
  }
}
