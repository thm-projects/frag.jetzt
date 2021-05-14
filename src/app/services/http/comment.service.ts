import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../../models/comment';
import { catchError, tap, map } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { TSMap } from 'typescript-map';
import { Vote } from '../../models/vote';

const httpOptions = {
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
      map(comment => this.parseUserNumber(comment)),
      tap(_ => ''),
      catchError(this.handleError<Comment>('getComment'))
    );
  }

  addComment(comment: Comment): Observable<Comment> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/';
    return this.http.post<Comment>(connectionUrl,
      {
        roomId: comment.roomId, body: comment.body,
        read: comment.read, creationTimestamp: comment.timestamp, tag: comment.tag, keywords: comment.keywords
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


  filter(com : Comment) : boolean {
    /* Get Filter Options */
    const currentFilters = JSON.parse(localStorage.getItem('currentFilters'));
    const period = JSON.parse(localStorage.getItem('currentPeriod'));
    const timestamp = JSON.parse(localStorage.getItem('currentFromNowTimestamp')); 

    /* Filter by Period */
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;

    enum Period {
      FROMNOW    = 'from-now',
      ONEHOUR    = 'time-1h',
      THREEHOURS = 'time-3h',
      ONEDAY     = 'time-1d',
      ONEWEEK    = 'time-1w',
      TWOWEEKS   = 'time-2w',
      ALL        = 'time-all'
    }

    if (period !== Period.ALL) {
      switch (period) {
        case Period.FROMNOW:
          break;
        case Period.ONEHOUR:
          periodInSeconds = hourInSeconds;
          break;
        case Period.THREEHOURS:
          periodInSeconds = hourInSeconds * 2;
          break;
        case Period.ONEDAY:
          periodInSeconds = hourInSeconds * 24;
          break;
        case Period.ONEWEEK:
          periodInSeconds = hourInSeconds * 168;
          break;
        case Period.TWOWEEKS:
          periodInSeconds = hourInSeconds * 336;
          break;
      }
    }

    const commentTime = new Date(com.timestamp).getTime();
    const refTime = (period === Period.FROMNOW ? timestamp : (currentTime.getTime() - periodInSeconds));
    
    if (commentTime < refTime) {
      return false;
    }

    /* Other Filters */
    const read = 'read';
    const unread = 'unread';
    const favorite = 'favorite';
    const correct = 'correct';
    const wrong = 'wrong';
    const bookmark = 'bookmark';
    const answer = 'answer';
    const unanswered = 'unanswered';

    enum CorrectWrong {
      NULL,
      CORRECT,
      WRONG
    }
    
    if (currentFilters != '') {  // no filters => return true
      switch (currentFilters) {
        case correct:
          return com.correct === CorrectWrong.CORRECT ? true : false;
        case wrong:
          return com.correct === CorrectWrong.WRONG ? true : false;
        case favorite:
          return com.favorite;
        case bookmark:
          return com.bookmark;
        case read:
          return com.read;
        case unread:
          return !com.read;
        case answer:
          return com.answer != "";
        case unanswered:
          return !com.answer;
      }
    }

    return true;
  }

  getFilteredComments(roomId: string) : Observable<Comment[]> {
    return this.getAckComments(roomId).pipe(map(commentList => commentList.filter(comment => this.filter(comment))));
  }

  getAckComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId: roomId, ack: true },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => {
        return commentList.map(comment => this.parseUserNumber(comment));
      }),
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  getRejectedComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId: roomId, ack: false },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => {
        return commentList.map(comment => this.parseUserNumber(comment));
      }),
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  getComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId: roomId },
      externalFilters: {}
    }, httpOptions).pipe(
      map(commentList => {
        return commentList.map(comment => this.parseUserNumber(comment));
      }),
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
      properties: { roomId: roomId, ack: ack },
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


  parseUserNumber(comment: Comment): Comment {
    comment.userNumber = this.hashCode(comment.creatorId);
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
