import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { Observable, catchError, map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export class QuotaStatus {
  disabled: boolean;
  inAccessTime: boolean;
  entries: { [key: UUID]: boolean };

  constructor({
    disabled = false,
    inAccessTime = false,
    entries = {},
  }: Partial<FieldsOf<QuotaStatus>>) {
    this.disabled = disabled;
    this.inAccessTime = inAccessTime;
    this.entries = entries;
  }
}

export type QuotaRecurringStrategy =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY'
  | 'NEVER';

type NumberStrategy = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type QuotaTimeStrategy =
  | 'MONDAYS'
  | 'TUESDAYS'
  | 'WEDNESDAYS'
  | 'THURSDAYS'
  | 'FRIDAYS'
  | 'SATURDAYS'
  | 'SUNDAYS'
  | 'DAILY'
  | 'WEEKDAYS'
  | 'WEEKENDS'
  | NumberStrategy
  | '10'
  | `1${NumberStrategy}`
  | '20'
  | `2${NumberStrategy}`
  | '30'
  | '31';

export class QuotaAccessTime {
  id: UUID;
  quotaId: UUID;
  startDate: [year: number, month: number, day: number];
  endDate: [year: number, month: number, day: number];
  recurringStrategy: QuotaRecurringStrategy;
  recurringFactor: number;
  strategy: QuotaTimeStrategy;
  startTime: [hour: number, minute: number];
  endTime: [hour: number, minute: number];
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    quotaId = null,
    startDate = null,
    endDate = null,
    recurringStrategy = null,
    recurringFactor = null,
    strategy = null,
    startTime = null,
    endTime = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<QuotaAccessTime>>) {
    this.id = id;
    this.quotaId = quotaId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.recurringStrategy = recurringStrategy;
    this.recurringFactor = recurringFactor;
    this.strategy = strategy;
    this.startTime = startTime;
    this.endTime = endTime;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export type QuotaResetStrategy =
  | 'DAILY'
  | 'WEEKLY'
  | 'WEEKLY_FLOWING'
  | 'MONTHLY'
  | 'MONTHLY_FLOWING'
  | 'YEARLY'
  | 'YEARLY_FLOWING'
  | 'NEVER';

export class QuotaEntry {
  id: UUID;
  quotaId: UUID;
  startDate: Date | null;
  endDate: Date | null;
  quota: number; // in 10^-8 US $ // total
  counter: number; // in 10^-8 US $ // used
  resetCounter: number;
  lastReset: Date;
  resetStrategy: QuotaResetStrategy; // ...
  resetFactor: number;
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    quotaId = null,
    startDate = null,
    endDate = null,
    quota = null,
    counter = null,
    resetCounter = null,
    lastReset = null,
    resetStrategy = null,
    resetFactor = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<QuotaEntry>>) {
    this.id = id;
    this.quotaId = quotaId;
    this.startDate = verifyInstance(Date, startDate);
    this.endDate = verifyInstance(Date, endDate);
    this.quota = quota;
    this.counter = counter;
    this.resetCounter = resetCounter;
    this.lastReset = verifyInstance(Date, lastReset);
    this.resetStrategy = resetStrategy;
    this.resetFactor = resetFactor;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class Quota {
  id: UUID;
  disabled: boolean;
  timezone: string;
  maxRequest: number; // in 10^-8 US $
  createdAt: Date;
  updatedAt: Date | null;
  // Transient
  entries: QuotaEntry[];
  accessTimes: QuotaAccessTime[];

  constructor({
    id = null,
    disabled = false,
    timezone = null,
    maxRequest = null,
    createdAt = new Date(),
    updatedAt = null,
    entries = [],
    accessTimes = [],
  }: Partial<FieldsOf<Quota>>) {
    this.id = id;
    this.disabled = disabled;
    this.timezone = timezone;
    this.maxRequest = maxRequest;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.entries = entries
      ? entries.map((item) => verifyInstance(QuotaEntry, item))
      : [];
    this.accessTimes = accessTimes
      ? accessTimes.map((item) => verifyInstance(QuotaAccessTime, item))
      : [];
  }
}

@Injectable({
  providedIn: 'root',
})
export class QuotaService extends BaseHttpService {
  private apiUrl = {
    base: '/api/quota',
    status: '/status',
  };

  constructor(private http: HttpClient) {
    super();
  }

  get(id: UUID): Observable<Quota> {
    return this.http.get<Quota>(`${this.apiUrl.base}/${id}`, httpOptions).pipe(
      tap(() => ''),
      map((res) => verifyInstance(Quota, res)),
      catchError(this.handleError<Quota>('get')),
    );
  }

  getStatus(id: UUID): Observable<QuotaStatus> {
    return this.http
      .get<QuotaStatus>(
        `${this.apiUrl.base}/${id}${this.apiUrl.status}`,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(QuotaStatus, res)),
        catchError(this.handleError<QuotaStatus>('getStatus')),
      );
  }
}
