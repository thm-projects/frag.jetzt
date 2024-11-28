import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';

interface FailedUpload {
  result: 'Failed';
  reason: string;
  filename: string;
}

export class UploadedFile {
  id: UUID;
  account_id: UUID;
  content_id: UUID;
  name: string;
  created_at: Date;
  updated_at: Date;

  constructor({
    id,
    account_id,
    content_id,
    name,
    created_at,
    updated_at,
  }: FieldsOf<UploadedFile>) {
    this.id = id;
    this.account_id = account_id;
    this.content_id = content_id;
    this.name = name;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

interface SuccessfulUpload {
  result: 'OK';
  file: UploadedFile;
  isNew: boolean;
  importResult: null | boolean | string;
}

@Injectable({
  providedIn: 'root',
})
export class AssistantFileService extends BaseHttpService {
  private apiUrl = {
    base: '/ai',
    file: '/file',
    upload: '/upload',
    delete: '/delete',
    content: '/content',
    list: '/list',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listFiles() {
    const url = `${this.apiUrl.base}${this.apiUrl.file}${this.apiUrl.list}`;
    return this.http.get<UploadedFile[]>(url, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    });
  }

  uploadFile(files: FileList) {
    const url = `${this.apiUrl.base}${this.apiUrl.file}${this.apiUrl.upload}`;
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    return this.http.post<(SuccessfulUpload | FailedUpload)[]>(url, formData, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
      reportProgress: true,
      observe: 'events',
    });
  }

  deleteFile(fileId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.file}${this.apiUrl.delete}/${fileId}`;
    return this.http.delete<void>(url);
  }

  getFileContent(fileId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.file}${this.apiUrl.content}/${fileId}`;
    return this.http.get(url, { responseType: 'arraybuffer' });
  }
}
