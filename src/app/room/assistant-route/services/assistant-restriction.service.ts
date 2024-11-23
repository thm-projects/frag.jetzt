import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export const RESTRICTION_TARGETS = [
  'ALL',
  'UNREGISTERED',
  'REGISTERED',
  'USER',
  'UNREGISTERED_USER',
  'REGISTERED_USER',
  'MOD',
  'UNREGISTERED_MOD',
  'REGISTERED_MOD',
  'CREATOR',
] as const;

export type RestrictionTarget = (typeof RESTRICTION_TARGETS)[number];

export class Restrictions {
  id: UUID;
  account_id: UUID;
  room_id: UUID;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    account_id,
    room_id,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<Restrictions>) {
    this.id = id;
    this.account_id = account_id;
    this.room_id = room_id;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export interface InputBlockRestriction {
  restriction_id: UUID;
  target: RestrictionTarget;
}

export class BlockRestriction {
  id: UUID;
  restriction_id: UUID;
  target: RestrictionTarget;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    restriction_id,
    target,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<BlockRestriction>) {
    this.id = id;
    this.restriction_id = restriction_id;
    this.target = target;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export interface InputQuotaRestriction {
  restriction_id: UUID;
  quota: string;
  target: RestrictionTarget;
  reset_strategy: string;
  timezone: string;
  last_reset: Date;
  end_time: Date;
}

export class QuotaRestriction {
  id: UUID;
  restriction_id: UUID;
  quota: string;
  counter: string;
  target: RestrictionTarget;
  reset_strategy: string;
  timezone: string;
  last_reset: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    restriction_id,
    quota,
    counter,
    target,
    reset_strategy,
    timezone,
    last_reset,
    end_time,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<QuotaRestriction>) {
    this.id = id;
    this.restriction_id = restriction_id;
    this.quota = quota;
    this.counter = counter;
    this.target = target;
    this.reset_strategy = reset_strategy;
    this.timezone = timezone;
    this.last_reset = verifyInstance(Date, last_reset);
    this.end_time = verifyInstance(Date, end_time);
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export interface InputTimeRestriction {
  restriction_id: UUID;
  start_time: Date;
  end_time: Date;
  target: RestrictionTarget;
  repeat_strategy: string;
  timezone: string;
}

export class TimeRestriction {
  id: UUID;
  restriction_id: UUID;
  start_time: Date;
  end_time: Date;
  target: RestrictionTarget;
  repeat_strategy: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    restriction_id,
    start_time,
    end_time,
    target,
    repeat_strategy,
    timezone,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<TimeRestriction>) {
    this.id = id;
    this.restriction_id = restriction_id;
    this.start_time = verifyInstance(Date, start_time);
    this.end_time = verifyInstance(Date, end_time);
    this.target = target;
    this.repeat_strategy = repeat_strategy;
    this.timezone = timezone;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AssistantRestrictionService extends BaseHttpService {
  private apiUrl = {
    base: '/ai/restriction',
    room: '/room',
    block: '/block',
    quota: '/quota',
    time: '/time',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listUserRestrictions() {
    const api = this.apiUrl;
    const url = `${api.base}/`;
    return this.http.get<Restrictions[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(Restrictions, v))),
    );
  }

  createUserRestriction(accountId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/`;
    return this.http
      .post<Restrictions>(
        url,
        {
          restriction: {
            account_id: accountId,
            room_id: null,
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(Restrictions, value)),
      );
  }

  deleteUserRestriction(restrictionId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listRoomRestrictions() {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/`;
    return this.http.get<Restrictions[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(Restrictions, v))),
    );
  }

  createRoomRestriction(roomId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/`;
    return this.http
      .post<Restrictions>(
        url,
        {
          restriction: {
            account_id: null,
            room_id: roomId,
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(Restrictions, value)),
      );
  }

  deleteRoomRestriction(restrictionId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listBlockRestrictionsForUser(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.block}`;
    return this.http.get<BlockRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(BlockRestriction, v))),
    );
  }

  createBlockRestrictionForUser(block_restriction: InputBlockRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.block}`;
    return this.http
      .post<BlockRestriction>(
        url,
        {
          block_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(BlockRestriction, value)),
      );
  }

  deleteBlockRestrictionForUser(restrictionsId: UUID, blockId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.block}/${blockId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listBlockRestrictionsForRoom(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.block}`;
    return this.http.get<BlockRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(BlockRestriction, v))),
    );
  }

  createBlockRestrictionForRoom(block_restriction: InputBlockRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}${api.block}`;
    return this.http
      .post<BlockRestriction>(
        url,
        {
          block_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(BlockRestriction, value)),
      );
  }

  deleteBlockRestrictionForRoom(restrictionsId: UUID, blockId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.block}/${blockId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listQuotaRestrictionsForUser(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.quota}`;
    return this.http.get<QuotaRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(QuotaRestriction, v))),
    );
  }

  createQuotaRestrictionForUser(quota_restriction: InputQuotaRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.quota}`;
    return this.http
      .post<QuotaRestriction>(
        url,
        {
          quota_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(QuotaRestriction, value)),
      );
  }

  deleteQuotaRestrictionForUser(restrictionsId: UUID, quotaId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.quota}/${quotaId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listQuotaRestrictionsForRoom(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.quota}`;
    return this.http.get<QuotaRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(QuotaRestriction, v))),
    );
  }

  createQuotaRestrictionForRoom(quota_restriction: InputQuotaRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}${api.quota}`;
    return this.http
      .post<QuotaRestriction>(
        url,
        {
          quota_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(QuotaRestriction, value)),
      );
  }

  deleteQuotaRestrictionForRoom(restrictionsId: UUID, quotaId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.quota}/${quotaId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listTimeRestrictionsForUser(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.time}`;
    return this.http.get<TimeRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(TimeRestriction, v))),
    );
  }

  createTimeRestrictionForUser(time_restriction: InputTimeRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.time}`;
    return this.http
      .post<TimeRestriction>(
        url,
        {
          time_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(TimeRestriction, value)),
      );
  }

  deleteTimeRestrictionForUser(restrictionsId: UUID, timeId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}/${restrictionsId}${api.time}/${timeId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listTimeRestrictionsForRoom(restrictionsId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.time}`;
    return this.http.get<TimeRestriction[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((values) => values.map((v) => verifyInstance(TimeRestriction, v))),
    );
  }

  createTimeRestrictionForRoom(time_restriction: InputTimeRestriction) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}${api.time}`;
    return this.http
      .post<TimeRestriction>(
        url,
        {
          time_restriction,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((value) => verifyInstance(TimeRestriction, value)),
      );
  }

  deleteTimeRestrictionForRoom(restrictionsId: UUID, timeId: UUID) {
    const api = this.apiUrl;
    const url = `${api.base}${api.room}/${restrictionsId}${api.time}/${timeId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }
}
