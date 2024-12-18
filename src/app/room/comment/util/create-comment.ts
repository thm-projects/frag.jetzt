import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Injector } from '@angular/core';
import { Comment } from 'app/models/comment';
import { comments } from 'app/room/state/comments';
import { room } from 'app/room/state/room';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import { NotificationService } from 'app/services/util/notification.service';
import { user } from 'app/user/state/user';
import {
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { SimpleAIService } from 'app/room/assistant-route/services/simple-ai.service';
import { language } from 'app/base/language/language';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { MatDialog } from '@angular/material/dialog';
import { CreateCommentComponent } from 'app/components/shared/_dialogs/create-comment/create-comment.component';
import { CommentService } from 'app/services/http/comment.service';

export interface CreateCommentOptions {
  body: Comment['body'];
  tag: Comment['tag'];
  questionerName: Comment['questionerName'];
  commentReference: Comment['commentReference'];
  selectedLanguage: Comment['language'];
  brainstormingSession: BrainstormingSession;
  injector: Injector;
}

const checkAndUpdateWord = (text: string, maxCount: number): string | null => {
  const words = new Intl.Segmenter(language(), { granularity: 'word' }).segment(
    text,
  );
  let newWord = '';
  let hadSeparator = false;
  for (const word of words) {
    if (word.isWordLike === false) {
      if (word.segment.trim().length === 0) {
        if (!hadSeparator) {
          newWord += ' ';
          hadSeparator = true;
        }
      } else {
        newWord += word.segment;
      }
      continue;
    }
    // checks
    maxCount--;
    if (maxCount < 0) return null;
    // update
    newWord += word.segment;
    hadSeparator = false;
  }
  return newWord;
};

const generateBrainstormingComment = (
  options: CreateCommentOptions,
): Observable<Comment> => {
  const text = checkAndUpdateWord(
    options.body,
    options.brainstormingSession.maxWordCount,
  );
  if (!text) {
    options.injector.get(NotificationService).show(
      i18nContext(i18n().wordLimitExceeded, {
        maxWordCount: String(options.brainstormingSession.maxWordCount),
      }),
    );
    return throwError(() => 'Word limit exceeded');
  }
  // TODO: Lemmatize
  const service = options.injector.get(BrainstormingService);
  const sessionId = options.brainstormingSession.id;
  return service.createWord(sessionId, text).pipe(
    switchMap((word) => {
      const userId = user().id;
      const isDuplicate = comments
        .value()
        ?.some(
          (e) =>
            e.creatorId === userId &&
            e.brainstormingWordId === word.id &&
            e.brainstormingSessionId === sessionId,
        );
      if (isDuplicate) {
        options.injector.get(NotificationService).show(i18n().alreadySubmitted);
        return throwError(() => 'Duplicate');
      }
      return of(word);
    }),
    map((word) => {
      return new Comment({
        body: options.body,
        tag: options.tag,
        questionerName: options.questionerName,
        roomId: room.value().id,
        creatorId: user().id,
        commentReference: options.commentReference,
        brainstormingSessionId: sessionId,
        brainstormingWordId: word.id,
        language: (
          options.brainstormingSession.language || 'AUTO'
        ).toUpperCase() as Comment['language'],
        keywordsFromSpacy: [],
        keywordsFromQuestioner: [],
      });
    }),
  );
};

export const generateComment = (
  options: CreateCommentOptions,
): Observable<Comment> => {
  if (options.brainstormingSession) {
    return generateBrainstormingComment(options);
  }
  const service = options.injector.get(SimpleAIService);
  const roomId = room.value().id;
  return service.getKeywords(options.body, roomId).pipe(
    catchError(() => of([])),
    map((keywords) => {
      return new Comment({
        body: options.body,
        tag: options.tag,
        questionerName: options.questionerName,
        roomId: room.value().id,
        creatorId: user().id,
        commentReference: options.commentReference,
        brainstormingSessionId: null,
        brainstormingWordId: null,
        keywordsFromSpacy: keywords,
        keywordsFromQuestioner: [],
        language: options.selectedLanguage,
      });
    }),
  );
};

const send = (injector: Injector, comment: Comment): Observable<Comment> => {
  const notification = injector.get(NotificationService);
  let message = '';
  if (room.value()?.directSend) {
    message = i18n().directSend;
    comment.ack = true;
  } else {
    message = i18n().moderatedSend;
    comment.ack = false;
  }
  return injector
    .get(CommentService)
    .addComment(comment)
    .pipe(tap(() => notification.show(message)));
};

export const writeInteractiveComment = (
  injector: Injector,
  brainstormingData?: BrainstormingSession,
  commentOverride?: Partial<Comment>,
): Observable<Comment> => {
  const ref = CreateCommentComponent.open(
    injector.get(MatDialog),
    brainstormingData,
  );
  return ref.afterClosed().pipe(
    switchMap((comment: Comment) => {
      if (commentOverride && comment) {
        for (const key of Object.keys(commentOverride)) {
          comment[key] = commentOverride[key];
        }
      }
      return comment ? send(injector, comment) : of<Comment>(null);
    }),
  );
};
