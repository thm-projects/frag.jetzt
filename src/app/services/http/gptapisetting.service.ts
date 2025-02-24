import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Observable, catchError, map, tap } from 'rxjs';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { Quota } from './quota.service';
import { GPTModels } from './gptvoucher.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export class GPTAPIKey {
  id: UUID;
  accountId: UUID;
  quotaId: UUID | null;
  apiKey: string;
  apiOrganization: string | null;
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    accountId = null,
    quotaId = null,
    apiKey = null,
    apiOrganization = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<GPTAPIKey>>) {
    this.id = id;
    this.accountId = accountId;
    this.quotaId = quotaId;
    this.apiKey = apiKey;
    this.apiOrganization = apiOrganization;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export type CreateGPTAPIKey = Pick<GPTAPIKey, 'apiKey' | 'apiOrganization'>;

@Injectable({
  providedIn: 'root',
})
export class GPTAPISettingService extends BaseHttpService {
  private apiUrl = {
    base: '/api/gpt-api/api-key',
    quota: '/quota',
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

  create(body: CreateGPTAPIKey): Observable<GPTAPIKey> {
    return this.http.post<GPTAPIKey>(this.apiUrl.base, body, httpOptions).pipe(
      tap(() => ''),
      map((res) => verifyInstance(GPTAPIKey, res)),
      catchError(this.handleError<GPTAPIKey>('create')),
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

  getKeys(): Observable<GPTAPIKey[]> {
    return this.http.get<GPTAPIKey[]>(this.apiUrl.base, httpOptions).pipe(
      tap(() => ''),
      map((res) => res.map((item) => verifyInstance(GPTAPIKey, item))),
      catchError(this.handleError<GPTAPIKey[]>('getAll')),
    );
  }

  createQuota(keyId: UUID, body: Quota): Observable<Quota> {
    return this.http
      .post<Quota>(
        `${this.apiUrl.base}/${keyId}${this.apiUrl.quota}`,
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
    keyId: UUID,
    quotaId: UUID,
    body: Partial<Quota>,
  ): Observable<Quota> {
    return this.http
      .patch<Quota>(
        `${this.apiUrl.base}/${keyId}${this.apiUrl.quota}/${quotaId}`,
        body,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('patchQuota')),
      );
  }

  deleteQuota(keyId: UUID, quotaId: UUID): Observable<void> {
    return this.http
      .delete<void>(
        `${this.apiUrl.base}/${keyId}${this.apiUrl.quota}/${quotaId}`,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('deleteQuota')),
      );
  }
}
