import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { FieldsOf, verifyInstance } from 'app/utils/ts-utils';
import { UUID } from 'crypto';
import { map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export const SHARE_TYPES = ['MINIMAL', 'VIEWABLE', 'COPYABLE'] as const;

export type ShareType = (typeof SHARE_TYPES)[number];

export interface InputAssistant {
  name: string;
  description: string;
  instruction: string;
  override_json_settings: string;
  model_name: string;
  provider_list: string;
  share_type: ShareType;
}

export class Assistant {
  id: UUID;
  room_id: UUID;
  account_id: UUID;
  name: string;
  description: string;
  instruction: string;
  override_json_settings: string;
  model_name: string;
  provider_list: string;
  share_type: ShareType;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    room_id,
    account_id,
    name,
    description,
    instruction,
    override_json_settings,
    model_name,
    provider_list,
    share_type,
    created_at = new Date(),
    updated_at,
  }: FieldsOf<Assistant>) {
    this.id = id;
    this.room_id = room_id;
    this.account_id = account_id;
    this.name = name;
    this.description = description;
    this.instruction = instruction;
    this.override_json_settings = override_json_settings;
    this.model_name = model_name;
    this.provider_list = provider_list;
    this.share_type = share_type;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export class AssistantFile {
  assistant_id: UUID;
  uploaded_file_id: UUID;
  created_at: Date;

  constructor({
    assistant_id,
    uploaded_file_id,
    created_at = new Date(),
  }: FieldsOf<AssistantFile>) {
    this.assistant_id = assistant_id;
    this.uploaded_file_id = uploaded_file_id;
    this.created_at = verifyInstance(Date, created_at);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AssistantManageService extends BaseHttpService {
  private apiUrl = {
    userBase: '/ai/assistant',
    roomBase: '/ai/room-assistant',
    platformBase: '/ai/platform-assistant',
    file: '/file',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listUserAssistants() {
    const api = this.apiUrl;
    const url = `${api.userBase}`;
    return this.http.get<Assistant[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((assistants) => assistants.map((a) => verifyInstance(Assistant, a))),
    );
  }

  createUserAssistant(assistant: InputAssistant) {
    const api = this.apiUrl;
    const url = `${api.userBase}`;
    return this.http.post<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  deleteUserAssistant(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.userBase}/${id}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  patchUserAssistant(id: UUID, assistant: Partial<InputAssistant>) {
    const api = this.apiUrl;
    const url = `${api.userBase}/${id}`;
    return this.http.patch<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  listUserAssistantFiles(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.userBase}/${id}${api.file}`;
    return this.http.get<AssistantFile[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((files) => files.map((f) => verifyInstance(AssistantFile, f))),
    );
  }

  createUserAssistantFiles(id: UUID, fileIds: UUID[]) {
    const api = this.apiUrl;
    const url = `${api.userBase}/${id}${api.file}`;
    return this.http
      .post<void>(
        url,
        {
          files: fileIds,
        },
        httpOptions,
      )
      .pipe(tap(() => ''));
  }

  deleteUserAssistantFile(id: UUID, fileId: UUID) {
    const api = this.apiUrl;
    const url = `${api.userBase}/${id}${api.file}/${fileId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listRoomAssistants() {
    const api = this.apiUrl;
    const url = `${api.roomBase}`;
    return this.http.get<Assistant[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((assistants) => assistants.map((a) => verifyInstance(Assistant, a))),
    );
  }

  createRoomAssistant(assistant: InputAssistant) {
    const api = this.apiUrl;
    const url = `${api.roomBase}`;
    return this.http.post<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  deleteRoomAssistant(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.roomBase}/${id}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  patchRoomAssistant(id: UUID, assistant: Partial<InputAssistant>) {
    const api = this.apiUrl;
    const url = `${api.roomBase}/${id}`;
    return this.http.patch<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  listRoomAssistantFiles(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.roomBase}/${id}${api.file}`;
    return this.http.get<AssistantFile[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((files) => files.map((f) => verifyInstance(AssistantFile, f))),
    );
  }

  createRoomAssistantFiles(id: UUID, fileIds: UUID[]) {
    const api = this.apiUrl;
    const url = `${api.roomBase}/${id}${api.file}`;
    return this.http
      .post<void>(
        url,
        {
          files: fileIds,
        },
        httpOptions,
      )
      .pipe(tap(() => ''));
  }

  deleteRoomAssistantFile(id: UUID, fileId: UUID) {
    const api = this.apiUrl;
    const url = `${api.roomBase}/${id}${api.file}/${fileId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  listPlatformAssistants() {
    const api = this.apiUrl;
    const url = `${api.platformBase}`;
    return this.http.get<Assistant[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((assistants) => assistants.map((a) => verifyInstance(Assistant, a))),
    );
  }

  createPlatformAssistant(assistant: InputAssistant) {
    const api = this.apiUrl;
    const url = `${api.platformBase}`;
    return this.http.post<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  deletePlatformAssistant(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.platformBase}/${id}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }

  patchPlatformAssistant(id: UUID, assistant: Partial<InputAssistant>) {
    const api = this.apiUrl;
    const url = `${api.platformBase}/${id}`;
    return this.http.patch<Assistant>(url, { assistant }, httpOptions).pipe(
      tap(() => ''),
      map((assistant) => verifyInstance(Assistant, assistant)),
    );
  }

  listPlatformAssistantFiles(id: UUID) {
    const api = this.apiUrl;
    const url = `${api.platformBase}/${id}${api.file}`;
    return this.http.get<AssistantFile[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((files) => files.map((f) => verifyInstance(AssistantFile, f))),
    );
  }

  createPlatformAssistantFiles(id: UUID, fileIds: UUID[]) {
    const api = this.apiUrl;
    const url = `${api.platformBase}/${id}${api.file}`;
    return this.http
      .post<void>(
        url,
        {
          files: fileIds,
        },
        httpOptions,
      )
      .pipe(tap(() => ''));
  }

  deletePlatformAssistantFile(id: UUID, fileId: UUID) {
    const api = this.apiUrl;
    const url = `${api.platformBase}/${id}${api.file}/${fileId}`;
    return this.http.delete(url, httpOptions).pipe(tap(() => ''));
  }
}
