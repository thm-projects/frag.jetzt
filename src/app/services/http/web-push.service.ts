import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';

export class WebPushSubscription {
  id: UUID;
  accountId: UUID;
  endpoint: string;
  key: string;
  auth: string;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    endpoint = null,
    key = null,
    auth = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<WebPushSubscription>>) {
    this.id = id;
    this.accountId = accountId;
    this.endpoint = endpoint;
    this.key = key;
    this.auth = auth;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }

  static fromPushSubscription(sub: PushSubscription) {
    const key = sub.getKey ? sub.getKey('p256dh') : null;
    const auth = sub.getKey ? sub.getKey('auth') : null;
    const transform = (t: ArrayBuffer | null) => {
      return t
        ? window.btoa(String.fromCharCode.apply(null, new Uint8Array(t)))
        : '';
    };
    return new WebPushSubscription({
      endpoint: sub.endpoint,
      key: transform(key),
      auth: transform(auth),
    });
  }
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

const httpOptionsPlainString = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),
  responseType: 'text',
} as const;

@Injectable({
  providedIn: 'root',
})
export class WebPushService extends BaseHttpService {
  private apiUrl = {
    base: '/api/webpush',
    subscription: '/subscription',
    publicKey: '/public-key',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getPublicKey(): Observable<string> {
    const url = this.apiUrl.base + this.apiUrl.publicKey;
    return this.http.get(url, httpOptionsPlainString).pipe(
      tap(() => ''),
      catchError(this.handleError<string>('getPublicKey')),
    );
  }

  createSubscription(
    sub: WebPushSubscription,
  ): Observable<WebPushSubscription> {
    const url = this.apiUrl.base + this.apiUrl.subscription;
    return this.http.post<WebPushSubscription>(url, sub, httpOptions).pipe(
      tap(() => ''),
      map((s) => new WebPushSubscription(s)),
      catchError(this.handleError<WebPushSubscription>('createSubscription')),
    );
  }

  deleteSubscription(id: WebPushSubscription['id']): Observable<void> {
    const url = this.apiUrl.base + this.apiUrl.subscription + '/' + id;
    return this.http.delete<void>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteSubscription')),
    );
  }

  getSubscriptions(): Observable<WebPushSubscription[]> {
    const url = this.apiUrl.base + this.apiUrl.subscription;
    return this.http.get<WebPushSubscription[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((subs) => subs.map((s) => new WebPushSubscription(s))),
      catchError(this.handleError<WebPushSubscription[]>('getSubscriptions')),
    );
  }
}
