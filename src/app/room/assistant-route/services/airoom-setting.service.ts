import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { map, Observable, tap } from 'rxjs';

const apiUrl = {
  base: '/ai/room-setting',
  voucher: '/voucher',
  check: '/check',
  claim: '/claim',
  revoke: '/revoke',
};

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export interface InputRoomAISetting {
  room_id: UUID;
  restriction_id: UUID | null;
  api_setup_id: UUID | null;
  allow_global_assistants: boolean;
  allow_user_assistants: boolean;
}

export class RoomAISetting {
  id: UUID;
  room_id: UUID;
  restriction_id?: UUID;
  api_setup_id?: UUID;
  api_voucher_id?: UUID;
  allow_global_assistants: boolean;
  allow_user_assistants: boolean;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    room_id = null,
    restriction_id = null,
    api_setup_id = null,
    api_voucher_id = null,
    allow_global_assistants = true,
    allow_user_assistants = false,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<RoomAISetting>) {
    this.id = id;
    this.room_id = room_id;
    this.restriction_id = restriction_id;
    this.api_setup_id = api_setup_id;
    this.api_voucher_id = api_voucher_id;
    this.allow_global_assistants = allow_global_assistants;
    this.allow_user_assistants = allow_user_assistants;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export type PatchRoomAISetting = Partial<Omit<InputRoomAISetting, 'room_id'>>;

export interface InputVoucher {
  voucher: string;
  restriction_id: UUID;
}

export class Voucher {
  id: UUID;
  room_id?: UUID;
  voucher: string;
  restriction_id: UUID;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    room_id = null,
    voucher = null,
    restriction_id = null,
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<Voucher>) {
    this.id = id;
    this.room_id = room_id;
    this.voucher = voucher;
    this.restriction_id = restriction_id;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AIRoomSettingService extends BaseHttpService {
  private http = inject(HttpClient);

  getRoomSetting(): Observable<RoomAISetting> {
    const url = `${apiUrl.base}/`;
    return this.http.get<RoomAISetting>(url, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(RoomAISetting, v)),
    );
  }

  createRoomSetting(setting: InputRoomAISetting): Observable<RoomAISetting> {
    const url = `${apiUrl.base}/`;
    return this.http
      .post<RoomAISetting>(
        url,
        { setting },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Room-Id': setting.room_id,
          }),
        },
      )
      .pipe(
        tap(() => ''),
        map((v) => verifyInstance(RoomAISetting, v)),
      );
  }

  patchRoomSetting(setting: PatchRoomAISetting): Observable<RoomAISetting> {
    const url = `${apiUrl.base}/`;
    return this.http.patch<RoomAISetting>(url, { setting }, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(RoomAISetting, v)),
    );
  }

  listVoucher(): Observable<Voucher[]> {
    const url = `${apiUrl.base}${apiUrl.voucher}`;
    return this.http.get<Voucher[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((v) => v.map((e) => verifyInstance(Voucher, e))),
    );
  }

  createVoucher(voucher: InputVoucher): Observable<Voucher> {
    const url = `${apiUrl.base}${apiUrl.voucher}`;
    return this.http.post<Voucher>(url, { voucher }, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(Voucher, v)),
    );
  }

  deleteVoucher(voucher_id: Voucher['id']): Observable<void> {
    const url = `${apiUrl.base}${apiUrl.voucher}/${voucher_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  checkVoucher(voucher: string): Observable<{ available: boolean }> {
    const url = `${apiUrl.base}${apiUrl.voucher}${apiUrl.check}`;
    return this.http
      .post<{ available: boolean }>(url, { voucher }, httpOptions)
      .pipe(tap(() => ''));
  }

  claimVoucher(voucher: string, roomId: UUID): Observable<{ status: 'OK' }> {
    const url = `${apiUrl.base}${apiUrl.voucher}${apiUrl.claim}`;
    return this.http
      .post<{ status: 'OK' }>(
        url,
        { voucher },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Room-Id': roomId,
          }),
        },
      )
      .pipe(tap(() => ''));
  }

  revokeVoucher(voucher_id: Voucher['id']): Observable<{ status: 'OK' }> {
    const url = `${apiUrl.base}${apiUrl.voucher}${apiUrl.revoke}/${voucher_id}`;
    return this.http
      .delete<{ status: 'OK' }>(url, httpOptions)
      .pipe(tap(() => ''));
  }
}
