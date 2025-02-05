import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { postSSE } from 'app/utils/sse-client';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { map, tap } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export interface MessageAdditionalKwargs {
  attachments: UUID[];
}

export interface Message {
  content: string | (string | Record<string, unknown>)[];
  additional_kwargs: MessageAdditionalKwargs | Record<string, unknown>;
  response_metadata: Record<string, unknown>;
  type: string;
  name?: string;
  id?: string;
}

export interface ToolMessage extends Message {
  tool_call_id: string;
  type: 'tool';
  artifact?: unknown;
  status: 'success' | 'error';
}

export interface SystemMessage extends Message {
  type: 'system';
}

export interface HumanMessage extends Message {
  type: 'human';
  example: boolean;
}

export interface AiMessage extends Message {
  type: 'ai';
  example: boolean;
  tool_calls: {
    name: string;
    args: Record<string, unknown>;
    id?: string;
    type?: 'tool_call';
  }[];
  invalid_tool_calls: {
    name?: string;
    args?: string;
    id?: string;
    error?: string;
    type?: 'invalid_tool_call';
  }[];
  usage_metadata: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_token_details?: {
      audio: number;
      cache_creation: number;
      cache_read: number;
    };
    output_token_details?: {
      audio: number;
      reasoning: number;
    };
  };
}

export type InputMessage = Pick<Message, 'content'> & {
  type?: 'human' | 'ai' | 'tool' | 'system';
  additional_kwargs?: MessageAdditionalKwargs;
};

export type BaseMessage = Message & Record<string, unknown>;

type ThreadShareType =
  | 'NONE'
  | 'CHAT_VIEW'
  | 'CHAT_COPY'
  | 'THREAD_VIEW'
  | 'THREAD_COPY'
  | 'SYNC_VIEW'
  | 'SYNC_COPY';

export class Thread {
  id: UUID;
  room_id: UUID;
  account_id: UUID;
  name: string;
  share_type: ThreadShareType;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    room_id,
    account_id,
    name,
    share_type = 'NONE',
    created_at = new Date(),
    updated_at = null,
  }: FieldsOf<Thread>) {
    this.id = id;
    this.room_id = room_id;
    this.account_id = account_id;
    this.name = name;
    this.share_type = share_type;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AssistantThreadService extends BaseHttpService {
  private apiUrl = {
    base: '/ai',
    thread: '/thread',
    list: '/list',
    new: '/new',
    continue: '/continue',
    messages: '/messages',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listThreads(roomId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.thread}${this.apiUrl.list}`;
    return this.http
      .get<object[]>(url, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Room-Id': roomId,
        }),
      })
      .pipe(
        tap(() => ''),
        map((threads) => threads.map((thread: Thread) => new Thread(thread))),
      );
  }

  newThread(roomId: string, message: InputMessage, assistantId: UUID) {
    const url = `${this.apiUrl.base}${this.apiUrl.thread}${this.apiUrl.new}`;
    return postSSE(
      this.http,
      url,
      {
        message,
        assistant_id: assistantId,
      },
      new HttpHeaders({ 'Room-Id': roomId }),
    );
  }

  continueThread(
    roomId: string,
    threadId: string,
    assistantId: UUID,
    message: InputMessage | null = null,
  ) {
    const url = `${this.apiUrl.base}${this.apiUrl.thread}${this.apiUrl.continue}/${threadId}`;
    return postSSE(
      this.http,
      url,
      {
        message: message || {},
        assistant_id: assistantId,
      },
      new HttpHeaders({ 'Room-Id': roomId }),
    );
  }

  getMessages(threadId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.thread}${this.apiUrl.messages}/${threadId}`;
    return this.http.get<BaseMessage[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((messages) =>
        messages.map((e) => {
          if (typeof e.content === 'string') {
            e.content = [e.content];
          }
          return e;
        }),
      ),
    );
  }

  deleteThread(threadId: string) {
    const url = `${this.apiUrl.base}${this.apiUrl.thread}/${threadId}`;
    return this.http.delete(url, httpOptions);
  }
}
