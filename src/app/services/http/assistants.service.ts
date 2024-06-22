import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { postSSE } from 'app/utils/sse-client';

export interface UploadedFile {
  id: string; // UUID
  accountId: string; // UUID
  fileName: string;
  fileInfo: string; // byte array
  createdAt: Date;
  udatedAt: Date;
}

export interface FileObject {
  id: string;
  bytes: number;
  createdAt: Date;
  filename: string;
  object: string;
  purpose: string;
}

export interface ToolFileSearch {
  type: 'file_search';
}

export interface ToolCodeInterpreter {
  type: 'code_interpreter';
}

export type Tools = ToolFileSearch | ToolCodeInterpreter;

export interface Assistant {
  id?: string;
  object?: string;
  created_at?: Date;
  model: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: Tools[];
  tool_resources?: unknown[];
  metadata?: Record<string, string>;
  temperature?: number;
  top_p?: number;
  response_format?: string;
}

export interface AssistantReference {
  id: string;
  openaiId: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  file_id: string;
  tools: { type: 'file_search' | 'code_interpreter' }[];
}

export interface CiteAnnotation {
  type: 'file_citation';
  text: string;
  start_index: number;
  end_index: number;
  file_citation: {
    file_id: string;
    quote?: string;
  };
}

export interface GeneratedAnnotation {
  type: 'file_path';
  text: string;
  start_index: number;
  end_index: number;
  file_path: {
    file_id: string;
  };
}

export type Annotation = CiteAnnotation | GeneratedAnnotation;

export interface ContentText {
  type: 'text';
  text: {
    value: string;
    annotations: Annotation[];
  };
}

export interface ContentImageUrl {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface ContentImage {
  type: 'image_file';
  image_file: {
    file_id: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export type Content = ContentText | ContentImageUrl | ContentImage;

export interface Message {
  role: string; // "user" or "assistant"
  content: Content[];
  attachments?: MessageAttachment[];
  metadata?: Record<string, string>;
}

export interface ThreadStarter {
  assistant_id: string;
  thread: {
    messages: Message[];
  };
  stream: true;
}

export interface ThreadContinuer {
  assistant_id: string;
  additional_messages: Message[];
  stream: true;
}

export interface ThreadReference {
  id: string; // UUID
  openaiId: string;
  accountId: string; // UUID
  roomId: string; // UUID
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageList {
  object: 'list';
  data: Message[];
}

@Injectable({
  providedIn: 'root',
})
export class AssistantsService extends BaseHttpService {
  private apiUrl = {
    base: '/api/assistants',
    upload: '/upload',
    fileContent: '/file-content',
    create: '/create-assistant',
    delte: '/delete-assistant',
    update: '/update-assistant',
    list: '/assistant-list',
    assistant: '/assistant',
    createThread: '/thread-create',
    deleteThread: '/thread-delete',
    runThread: '/thread-run',
    threadList: '/thread-list',
    threadMessages: '/thread-messages',
    getFile: '/file',
  };

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  };

  constructor(private client: HttpClient) {
    super();
  }

  uploadFile(file: File) {
    const url = this.apiUrl.base + this.apiUrl.upload;
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post<UploadedFile>(url, formData, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    });
  }

  uploadToOpenAI(roomId: string, uploadedId: string) {
    const url =
      this.apiUrl.base + this.apiUrl.upload + '/' + roomId + '/' + uploadedId;
    return this.client.post<FileObject>(url, null, this.httpOptions);
  }

  getFileContent(roomId: string, fileId: string) {
    const url =
      this.apiUrl.base + this.apiUrl.fileContent + '/' + roomId + '/' + fileId;
    return this.client.get(url, {
      responseType: 'arraybuffer',
    });
  }

  createAssistant(roomId: string, a: Assistant) {
    const url = this.apiUrl.base + this.apiUrl.create + '/' + roomId;
    return this.client.post<AssistantReference>(url, a, this.httpOptions);
  }

  delete(id: AssistantReference['id']) {
    const url = this.apiUrl.base + this.apiUrl.delte + '/' + id;
    return this.client.delete<void>(url, this.httpOptions);
  }

  update(id: AssistantReference['id'], a: Partial<Assistant>) {
    const url = this.apiUrl.base + this.apiUrl.update + '/' + id;
    return this.client.patch<Assistant>(url, a, this.httpOptions);
  }

  listAssistants(roomId: string) {
    const url = this.apiUrl.base + this.apiUrl.list + '/' + roomId;
    return this.client.get<AssistantReference[]>(url, this.httpOptions);
  }

  getAssistant(roomId: string, openaiId: string) {
    const url =
      this.apiUrl.base + this.apiUrl.assistant + '/' + roomId + '/' + openaiId;
    return this.client.get<Assistant>(url, this.httpOptions);
  }

  createThread(roomId: string, starter: ThreadStarter) {
    const url = this.apiUrl.base + this.apiUrl.createThread + '/' + roomId;
    return postSSE(this.client, url, starter);
  }

  continueThread(threadId: string, continuer: ThreadContinuer) {
    const url = this.apiUrl.base + this.apiUrl.runThread + '/' + threadId;
    return postSSE(this.client, url, continuer);
  }

  listThreads(roomId: string) {
    const url = this.apiUrl.base + this.apiUrl.threadList + '/' + roomId;
    return this.client.get<ThreadReference[]>(url, this.httpOptions);
  }

  getThreadMessages(threadId: string, after: string) {
    const url =
      this.apiUrl.base +
      this.apiUrl.threadMessages +
      '/' +
      threadId +
      (after != null ? '?after=' + after : '');
    return this.client.get<MessageList>(url, this.httpOptions);
  }

  deleteThread(threadId: string) {
    const url = this.apiUrl.base + this.apiUrl.deleteThread + '/' + threadId;
    return this.client.delete<void>(url, this.httpOptions);
  }

  getFile(roomId: string, fileId: string) {
    const url =
      this.apiUrl.base + this.apiUrl.getFile + '/' + roomId + '/' + fileId;
    return this.client.get<FileObject>(url, this.httpOptions);
  }
}
