import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { Observable, catchError, map, tap } from 'rxjs';

export enum InterestBit {
  CREATED = 0x1,
  DELETED = 0x2,
  ANSWERED = 0x4,
  CHANGE_ACK = 0x8,
  CHANGE_FAVORITE = 0x10,
  CHANGE_CORRECT = 0x20,
  CHANGE_TAG = 0x40,
  CHANGE_SCORE = 0x80,
}

export const DEFAULT_INTEREST =
  InterestBit.CREATED |
  InterestBit.DELETED |
  InterestBit.ANSWERED |
  InterestBit.CHANGE_ACK |
  InterestBit.CHANGE_FAVORITE |
  InterestBit.CHANGE_CORRECT |
  InterestBit.CHANGE_TAG |
  InterestBit.CHANGE_SCORE;

export class PushCommentSubscription {
  id: UUID;
  accountId: UUID;
  roomId: UUID;
  commentId: UUID;
  interestBits: number;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    roomId = null,
    commentId = null,
    interestBits = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<PushCommentSubscription>>) {
    this.id = id;
    this.accountId = accountId;
    this.roomId = roomId;
    this.commentId = commentId;
    this.interestBits = interestBits;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class PushRoomSubscription {
  id: UUID;
  accountId: UUID;
  roomId: UUID;
  ownCommentBits: number;
  otherCommentBits: number;
  createdAt: Date;
  updatedAt: Date;
  commentSubscriptions: PushCommentSubscription[];

  constructor({
    id = null,
    accountId = null,
    roomId = null,
    ownCommentBits = null,
    otherCommentBits = null,
    createdAt = new Date(),
    updatedAt = null,
    commentSubscriptions = null,
  }: Partial<FieldsOf<PushRoomSubscription>>) {
    this.id = id;
    this.accountId = accountId;
    this.roomId = roomId;
    this.ownCommentBits = ownCommentBits;
    this.otherCommentBits = otherCommentBits;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.commentSubscriptions = commentSubscriptions
      ? commentSubscriptions.map((c) =>
          verifyInstance(PushCommentSubscription, c),
        )
      : [];
  }
}

export type PushRoomSubscriptionCreate = Pick<
  PushRoomSubscription,
  'roomId' | 'ownCommentBits' | 'otherCommentBits'
>;

export type PushCommentSubscriptionCreate = Pick<
  PushCommentSubscription,
  'commentId' | 'roomId' | 'interestBits'
>;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class ChangeSubscriptionService extends BaseHttpService {
  private apiUrl = {
    base: '/api/change-subscription',
    room: '/room',
    comment: '/comment',
    roomComments: '/room-comments',
  };

  constructor(private http: HttpClient) {
    super();
  }

  createRoomSubscription(
    createPayload: PushRoomSubscriptionCreate,
  ): Observable<PushRoomSubscription> {
    const url = this.apiUrl.base + this.apiUrl.room;
    return this.http
      .post<PushRoomSubscription>(url, createPayload, httpOptions)
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(PushRoomSubscription, res)),
        catchError(
          this.handleError<PushRoomSubscription>('createRoomSubscription'),
        ),
      );
  }

  getRoomSubscriptions(): Observable<PushRoomSubscription[]> {
    const url = this.apiUrl.base + this.apiUrl.room;
    return this.http.get<PushRoomSubscription[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((res) => res.map((r) => verifyInstance(PushRoomSubscription, r))),
      catchError(
        this.handleError<PushRoomSubscription[]>('getRoomSubscriptions'),
      ),
    );
  }

  getRoomSubscription(roomId: UUID): Observable<PushRoomSubscription> {
    const url = this.apiUrl.base + this.apiUrl.room + '/' + roomId;
    return this.http.get<PushRoomSubscription>(url, httpOptions).pipe(
      tap(() => ''),
      map((res) => verifyInstance(PushRoomSubscription, res)),
      catchError(this.handleError<PushRoomSubscription>('getRoomSubscription')),
    );
  }

  deleteRoomSubscription(roomId: UUID): Observable<void> {
    const url = this.apiUrl.base + this.apiUrl.room + '/' + roomId;
    return this.http.delete<void>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteRoomSubscription')),
    );
  }

  deleteRoomCommentSubscriptions(roomId: UUID): Observable<void> {
    const url = this.apiUrl.base + this.apiUrl.roomComments + '/' + roomId;
    return this.http.delete<void>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteRoomCommentSubscriptions')),
    );
  }

  createCommentSubscription(
    createPayload: PushCommentSubscriptionCreate,
  ): Observable<PushCommentSubscription> {
    const url = this.apiUrl.base + this.apiUrl.comment;
    return this.http
      .post<PushCommentSubscription>(url, createPayload, httpOptions)
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(PushCommentSubscription, res)),
        catchError(
          this.handleError<PushCommentSubscription>(
            'createCommentSubscription',
          ),
        ),
      );
  }

  getCommentSubscription(commentId: UUID): Observable<PushCommentSubscription> {
    const url = this.apiUrl.base + this.apiUrl.comment + '/' + commentId;
    return this.http.get<PushCommentSubscription>(url, httpOptions).pipe(
      tap(() => ''),
      map((res) => verifyInstance(PushCommentSubscription, res)),
      catchError(
        this.handleError<PushCommentSubscription>('getCommentSubscription'),
      ),
    );
  }

  deleteCommentSubscription(commentId: UUID): Observable<void> {
    const url = this.apiUrl.base + this.apiUrl.comment + '/' + commentId;
    return this.http.delete<void>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteCommentSubscription')),
    );
  }
}
