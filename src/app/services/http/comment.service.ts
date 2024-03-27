import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../../models/comment';
import { catchError, map, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { TSMap } from 'typescript-map';
import { Vote } from '../../models/vote';
import { JSONString } from '../../utils/ts-utils';
import {
  ImportedComment,
  ImportedCommentFields,
} from '../../utils/ImportExportMethods';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export interface RoomQuestionCounts {
  questionCount: number;
  responseCount: number;
}

interface CountRequest {
  roomId: string;
  ack: boolean;
}

export type CommentAPI = Omit<
  Comment,
  'keywordsFromQuestioner' | 'keywordsFromSpacy' | 'body'
> & {
  keywordsFromQuestioner: JSONString;
  keywordsFromSpacy: JSONString;
  body: string;
};

@Injectable()
export class CommentService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    comment: '/comment',
    find: '/find',
    count: '/count',
    vote: '/vote',
    import: '/import',
    bulkDelete: '/bulkdelete',
    byRoom: '/byRoom',
  };

  constructor(private http: HttpClient) {
    super();
  }

  toggleRead(comment: Comment): Observable<Comment> {
    comment.read = !comment.read;
    const changes = new TSMap<string, unknown>();
    changes.set('read', comment.read);
    return this.patchComment(comment, changes);
  }

  toggleFavorite(comment: Comment): Observable<Comment> {
    comment.favorite = !comment.favorite;
    const changes = new TSMap<string, unknown>();
    changes.set('favorite', comment.favorite);
    return this.patchComment(comment, changes);
  }

  markCorrect(comment: Comment): Observable<Comment> {
    const changes = new TSMap<string, unknown>();
    changes.set('correct', comment.correct);
    return this.patchComment(comment, changes);
  }

  toggleAck(comment: Comment): Observable<Comment> {
    comment.ack = !comment.ack;
    const changes = new TSMap<string, unknown>();
    changes.set('ack', comment.ack);
    return this.patchComment(comment, changes);
  }

  toggleBookmark(comment: Comment): Observable<Comment> {
    comment.bookmark = !comment.bookmark;
    const changes = new TSMap<string, unknown>();
    changes.set('bookmark', comment.bookmark);
    return this.patchComment(comment, changes);
  }

  updateCommentTag(comment: Comment, tag: string): Observable<Comment> {
    comment.tag = tag;
    const changes = new TSMap<string, unknown>();
    changes.set('tag', tag);
    return this.patchComment(comment, changes);
  }

  getComment(commentId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.comment}/${commentId}`;
    return this.http.get<CommentAPI>(connectionUrl, httpOptions).pipe(
      map((comment) => this.parseComment(comment)),
      tap(() => ''),
      catchError(this.handleError<Comment>('getComment')),
    );
  }

  addComment(comment: Comment): Observable<Comment> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/';
    return this.http
      .post<CommentAPI>(
        connectionUrl,
        {
          roomId: comment.roomId,
          creatorId: comment.creatorId,
          body: comment.body,
          tag: comment.tag,
          keywordsFromSpacy: JSON.stringify(comment.keywordsFromSpacy),
          keywordsFromQuestioner: JSON.stringify(
            comment.keywordsFromQuestioner,
          ),
          language: comment.language,
          questionerName: comment.questionerName,
          brainstormingSessionId: comment.brainstormingSessionId,
          brainstormingWordId: comment.brainstormingWordId,
          commentReference: comment.commentReference,
          gptWriterState: comment.gptWriterState,
          approved: comment.approved,
        },
        httpOptions,
      )
      .pipe(
        map((c) => this.parseComment(c)),
        tap(() => ''),
        catchError(this.handleError<Comment>('addComment')),
      );
  }

  importComments(comments: ImportedComment[]): Observable<Comment[]> {
    const importData = comments.map((comment) => {
      const c = {} as CommentAPI;
      for (const field of ImportedCommentFields) {
        c[field] = comment[field] as never;
      }
      c.body = comment.body;
      c.keywordsFromSpacy = '[]' as JSONString;
      c.keywordsFromQuestioner = JSON.stringify(
        comment.keywordsFromQuestioner ?? [],
      ) as JSONString;
      return c;
    });
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.import + '/';
    return this.http
      .post<CommentAPI[]>(connectionUrl, importData, httpOptions)
      .pipe(
        map((cApis) => cApis.map((c) => this.parseComment(c))),
        tap(() => ''),
        catchError(this.handleError<Comment[]>('importComments')),
      );
  }

  deleteComment(commentId: string): Observable<void> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.comment
    }/${commentId}`;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteComment')),
    );
  }

  getAckComments(roomId: string): Observable<Comment[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http
      .post<CommentAPI[]>(
        connectionUrl,
        {
          properties: { roomId, ack: true },
          externalFilters: {},
        },
        httpOptions,
      )
      .pipe(
        map((commentList) =>
          commentList.map((comment) => this.parseComment(comment)),
        ),
        tap(() => ''),
        catchError(this.handleError<Comment[]>('getComments', [])),
      );
  }

  getRejectedComments(roomId: string): Observable<Comment[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http
      .post<CommentAPI[]>(
        connectionUrl,
        {
          properties: { roomId, ack: false },
          externalFilters: {},
        },
        httpOptions,
      )
      .pipe(
        map((commentList) =>
          commentList.map((comment) => this.parseComment(comment)),
        ),
        tap(() => ''),
        catchError(this.handleError<Comment[]>('getComments', [])),
      );
  }

  getComments(roomId: string): Observable<Comment[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http
      .post<CommentAPI[]>(
        connectionUrl,
        {
          properties: { roomId },
          externalFilters: {},
        },
        httpOptions,
      )
      .pipe(
        map((commentList) =>
          commentList.map((comment) => this.parseComment(comment)),
        ),
        tap(() => ''),
        catchError(this.handleError<Comment[]>('getComments', [])),
      );
  }

  updateComment(comment: Comment): Observable<unknown> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + '/' + comment.id;
    return this.http.put(connectionUrl, comment, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<unknown>('updateComment')),
    );
  }

  patchComment(comment: Comment, changes: TSMap<string, unknown>) {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + '/' + comment.id;
    return this.http
      .patch<CommentAPI>(connectionUrl, changes, httpOptions)
      .pipe(
        map((c) => this.parseComment(c)),
        tap(() => ''),
        catchError(this.handleError<Comment>('patchComment')),
      );
  }

  highlight(comment: Comment) {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + '/' + comment.id + '/highlight';
    return this.http.post(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<unknown>('highlightComment')),
    );
  }

  lowlight(comment: Comment) {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + '/' + comment.id + '/lowlight';
    return this.http.post(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<unknown>('lowlightComment')),
    );
  }

  role(comment: Comment) {
    const connectionUrl = this.apiUrl.comment + '/' + comment.id + '/role';
    return this.http.patch(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<unknown>('roleComment')),
    );
  }

  deleteCommentsByRoomId(roomId: string): Observable<Comment> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.byRoom
    }?roomId=${roomId}`;
    return this.http.delete<Comment>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Comment>('deleteComment')),
    );
  }

  bulkDeleteComments(commentIds: string[]): Observable<void> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.bulkDelete
    }`;
    return this.http.post<void>(connectionUrl, commentIds, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('bulkDeleteComments')),
    );
  }

  countByRoomId(rooms: CountRequest[]): Observable<RoomQuestionCounts[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.comment + this.apiUrl.count;
    return this.http
      .post<RoomQuestionCounts[]>(connectionUrl, rooms, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<RoomQuestionCounts[]>('countByRoomId', [])),
      );
  }

  voteUp(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }

  voteDown(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: -1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }

  resetVote(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 0 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }

  parseComment(comment: CommentAPI): Comment {
    const parsedComment = comment as unknown as Comment;
    if (!comment) {
      return parsedComment;
    }
    parsedComment.keywordsFromQuestioner = JSON.parse(
      comment.keywordsFromQuestioner ?? null,
    );
    parsedComment.keywordsFromSpacy = JSON.parse(
      comment.keywordsFromSpacy ?? null,
    );
    return parsedComment;
  }

  hashCode(s) {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = Math.abs((Math.imul(31, hash) + s.charCodeAt(i)) | 0);
    }
    const userNumberString = String(hash);
    hash = +userNumberString.substring(
      userNumberString.length - 4,
      userNumberString.length,
    );
    return hash;
  }
}
