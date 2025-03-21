import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Observable, catchError, map, tap } from 'rxjs';
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { UUID, verifyInstance } from 'app/utils/ts-utils';
import { Quota } from './quota.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export type PatchRoomSetting = Pick<
  GPTRoomSetting,
  | 'roomQuotaId'
  | 'participantQuotaId'
  | 'moderatorQuotaId'
  | 'rightsBitset'
  | 'presetContext'
  | 'presetLength'
  | 'roleInstruction'
  | 'defaultModel'
  | 'apiKeys'
  | 'apiModels'
>;

@Injectable({
  providedIn: 'root',
})
export class GPTRoomService extends BaseHttpService {
  private apiUrl = {
    base: '/api/gpt/room-setting',
    participantQuota: '/participant-quota',
    moderatorQuota: '/moderator-quota',
    roomQuota: '/room-quota',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getByRoomId(roomId: string): Observable<GPTRoomSetting> {
    return this.http.get<GPTRoomSetting>(`${this.apiUrl.base}/${roomId}`).pipe(
      tap(() => ''),
      map((res) => verifyInstance(GPTRoomSetting, res)),
      catchError(this.handleError<GPTRoomSetting>('getByRoomId')),
    );
  }

  patchRoomSettings(
    roomId: string,
    roomSetting: Partial<PatchRoomSetting>,
  ): Observable<GPTRoomSetting> {
    return this.http
      .patch<GPTRoomSetting>(
        `${this.apiUrl.base}/${roomId}`,
        roomSetting,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(GPTRoomSetting, res)),
        catchError(this.handleError<GPTRoomSetting>('patchRoomSettings')),
      );
  }

  patchParticipantQuota(
    roomId: string,
    quotaId: UUID,
    quota: Partial<Quota>,
  ): Observable<Quota> {
    return this.http
      .patch<Quota>(
        `${this.apiUrl.base}/${roomId}${this.apiUrl.participantQuota}/${quotaId}`,
        quota,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('patchParticipantQuota')),
      );
  }

  patchModeratorQuota(
    roomId: string,
    quotaId: UUID,
    quota: Partial<Quota>,
  ): Observable<Quota> {
    return this.http
      .patch<Quota>(
        `${this.apiUrl.base}/${roomId}${this.apiUrl.moderatorQuota}/${quotaId}`,
        quota,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('patchModeratorQuota')),
      );
  }

  patchRoomQuota(
    roomId: string,
    quotaId: UUID,
    quota: Partial<Quota>,
  ): Observable<Quota> {
    return this.http
      .patch<Quota>(
        `${this.apiUrl.base}/${roomId}${this.apiUrl.roomQuota}/${quotaId}`,
        quota,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((res) => verifyInstance(Quota, res)),
        catchError(this.handleError<Quota>('patchRoomQuota')),
      );
  }
}
