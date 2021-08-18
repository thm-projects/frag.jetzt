import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../../models/comment';
import { catchError, tap, map } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { TSMap } from 'typescript-map';
import { Vote } from '../../models/vote';
import { CommentFilter } from '../../utils/filter-options';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class CommentService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    comment: '/comment',
    find: '/find',
    count: '/count',
    vote: '/vote'
  };

  constructor(private http: HttpClient) {
    super();
  }


  answer(comment: Comment, answer: string): Observable<Comment> {
    comment.answer = answer;
    const changes = new TSMap<string, any>();
    changes.set('answer', comment.answer);
    return this.patchComment(comment, changes);
  }

  toggleRead(comment: Comment): Observable<Comment> {
    comment.read = !comment.read;
    const changes = new TSMap<string, any>();
    changes.set('read', comment.read);
    return this.patchComment(comment, changes);
  }

  toggleFavorite(comment: Comment): Observable<Comment> {
    comment.favorite = !comment.favorite;
    const changes = new TSMap<string, any>();
    changes.set('favorite', comment.favorite);
    return this.patchComment(comment, changes);
  }

  markCorrect(comment: Comment): Observable<Comment> {
    const changes = new TSMap<string, any>();
    changes.set('correct', comment.correct);
    return this.patchComment(comment, changes);
  }

  toggleAck(comment: Comment): Observable<Comment> {
    comment.ack = !comment.ack;
    const changes = new TSMap<string, any>();
    changes.set('ack', comment.ack);
    return this.patchComment(comment, changes);
  }

  toggleBookmark(comment: Comment): Observable<Comment> {
    comment.bookmark = !comment.bookmark;
    const changes = new TSMap<string, any>();
    changes.set('bookmark', comment.bookmark);
    return this.patchComment(comment, changes);
  }


  getComment(commentId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.comment}/${commentId}`;
    return this.http.get<Comment>(connectionUrl, httpOptions).pipe(
      map(comment => this.parseComment(comment)),
      tap(_ => ''),
      catchError(this.handleError<Comment>('getComment'))
    );
  }

  addComment(comment: Comment): Observable<Comment> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/';
    return this.http.post<Comment>(connectionUrl,
      {
        roomId: comment.roomId, body: comment.body,
        read: comment.read, creationTimestamp: comment.timestamp, tag: comment.tag,
        keywordsFromSpacy: JSON.stringify(comment.keywordsFromSpacy),
        keywordsFromQuestioner: JSON.stringify(comment.keywordsFromQuestioner),
        language: comment.language
      }, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment>('addComment'))
    );
  }

  deleteComment(commentId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.comment}/${commentId}`;
    return this.http.delete<Comment>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment>('deleteComment'))
    );
  }

  getAckComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId, ack: true },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => commentList.map(comment => this.parseComment(comment))),
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  getRejectedComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId, ack: false },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => commentList.map(comment => this.parseComment(comment))),
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  getComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => commentList.map(comment => this.parseComment(comment))),
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  updateComment(comment: Comment): Observable<any> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/' + comment.id;
    return this.http.put(connectionUrl, comment, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateComment'))
    );
  }

  patchComment(comment: Comment, changes: TSMap<string, any>) {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/' + comment.id;
    return this.http.patch(connectionUrl, changes, httpOptions).pipe(
      map(c => this.parseComment(c as Comment)),
      tap(_ => ''),
      catchError(this.handleError<any>('patchComment'))
    );
  }

  highlight(comment: Comment) {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/' + comment.id + '/highlight';
    return this.http.patch(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('highlightComment'))
    );
  }

  lowlight(comment: Comment) {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/' + comment.id + '/lowlight';
    return this.http.patch(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('lowlightComment'))
    );
  }

  role(comment: Comment) {
    const connectionUrl = this.apiUrl.comment + '/' + comment.id + '/role';
    return this.http.patch(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('roleComment'))
    );
  }

  deleteCommentsByRoomId(roomId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.comment}/byRoom?roomId=${roomId}`;
    return this.http.delete<Comment>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment>('deleteComment'))
    );
  }

  countByRoomId(roomId: string, ack: boolean): Observable<number> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find + this.apiUrl.count;
    return this.http.post<number>(connectionUrl, {
      properties: { roomId, ack },
      externalFilters: {}
    }, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<number>('countByRoomId', 0))
    );
  }


  voteUp(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Vote>('voteUp'))
    );
  }

  voteDown(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: -1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Vote>('voteUp'))
    );
  }

  resetVote(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 0 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Vote>('voteUp'))
    );
  }


  parseComment(comment: Comment): Comment {
    if (!comment){
      return;
    }
    comment.userNumber = this.hashCode(comment.creatorId);
    comment.keywordsFromQuestioner = comment.keywordsFromQuestioner ?
                                     JSON.parse(comment.keywordsFromQuestioner as unknown as string) : null;
    comment.keywordsFromSpacy = comment.keywordsFromSpacy ? JSON.parse(comment.keywordsFromSpacy as unknown as string) : null;
    console.log(comment);
    return comment;
  }

  hashCode(s) {
    let hash;
    for (let i = 0, h = 0; i < s.length; i++) {
      hash = Math.abs(Math.imul(31, hash) + s.charCodeAt(i) | 0);
    }
    const userNumberString = String(hash);
    hash = +userNumberString.substring(userNumberString.length - 4, userNumberString.length);
    return hash;
  }
}
