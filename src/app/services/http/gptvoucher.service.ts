import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { Observable, catchError, map, tap } from 'rxjs';
import { Quota } from './quota.service';

export interface GPTModels {
  object: 'list';
  data: {
    object: 'model';
    id: string;
    created: number; // * 1000 = Date
    ownedBy: string;
  };
}

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export class GPTVoucher {
  id: UUID;
  code: string;
  accountId: UUID | null;
  quotaId: UUID | null;
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    code = null,
    accountId = null,
    quotaId = null,
    createdAt = null,
    updatedAt = null,
  }: Partial<FieldsOf<GPTVoucher>>) {
    this.id = id;
    this.code = code;
    this.accountId = accountId;
    this.quotaId = quotaId;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

@Injectable({
  providedIn: 'root',
})
export class GPTVoucherService extends BaseHttpService {
  private apiUrl = {
    base: '/api/gpt-api/voucher',
    quota: '/quota',
    claim: '/claim',
    claimable: '/claimable',
    all: '/all',
    models: '/models',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getModels(): Observable<GPTModels> {
    return this.http
      .get<GPTModels>(`${this.apiUrl.base}${this.apiUrl.models}`)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<GPTModels>('getModels')),
      );
  }

  create(code: string): Observable<GPTVoucher> {
    code = encodeURIComponent(code);
    return this.http
      .post<GPTVoucher>(`${this.apiUrl.base}/${code}`, undefined, httpOptions)
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(GPTVoucher, res)),
        catchError(this.handleError<GPTVoucher>('create')),
      );
  }

  delete(id: UUID): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl.base}/${id}`, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('delete')),
      );
  }

  getVouchers(): Observable<GPTVoucher[]> {
    return this.http.get<GPTVoucher[]>(this.apiUrl.base).pipe(
      tap(() => ''),
      map((res) => res.map((item) => verifyInstance(GPTVoucher, item))),
      catchError(this.handleError<GPTVoucher[]>('getAll')),
    );
  }

  getAll(): Observable<GPTVoucher[]> {
    return this.http
      .get<GPTVoucher[]>(`${this.apiUrl.base}${this.apiUrl.all}`)
      .pipe(
        tap(() => ''),
        map((res) => res.map((item) => verifyInstance(GPTVoucher, item))),
        catchError(this.handleError<GPTVoucher[]>('getAll')),
      );
  }

  isClaimable(code: string): Observable<GPTVoucher> {
    code = encodeURIComponent(code);
    return this.http
      .get<GPTVoucher>(`${this.apiUrl.base}${this.apiUrl.claimable}/${code}`)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<GPTVoucher>('isClaimable')),
      );
  }

  claim(code: string): Observable<GPTVoucher> {
    code = encodeURIComponent(code);
    return this.http
      .post<GPTVoucher>(
        `${this.apiUrl.base}${this.apiUrl.claim}/${code}`,
        undefined,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(GPTVoucher, res)),
        catchError(this.handleError<GPTVoucher>('claim')),
      );
  }

  createQuota(voucherId: UUID, body: Quota): Observable<Quota> {
    return this.http
      .post<Quota>(
        `${this.apiUrl.base}/${voucherId}${this.apiUrl.quota}`,
        body,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('createQuota')),
      );
  }

  patchQuota(
    voucherId: UUID,
    quotaId: UUID,
    body: Partial<Quota>,
  ): Observable<Quota> {
    return this.http
      .patch<Quota>(
        `${this.apiUrl.base}/${voucherId}${this.apiUrl.quota}/${quotaId}`,
        body,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('patchQuota')),
      );
  }

  deleteQuota(voucherId: UUID, quotaId: UUID): Observable<void> {
    return this.http
      .delete<void>(
        `${this.apiUrl.base}/${voucherId}${this.apiUrl.quota}/${quotaId}`,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('deleteQuota')),
      );
  }
}
