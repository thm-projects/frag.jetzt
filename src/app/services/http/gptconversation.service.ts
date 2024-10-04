import { Injectable } from '@angular/core';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';

export class GPTConversationEntry {
  id?: UUID;
  conversationId: UUID;
  index?: number;
  role: string;
  content: string;
  name?: string;
  functionCall?: object;
  createdAt: Date;
  updatedAt?: Date;

  constructor({
    id = null,
    conversationId = null,
    index = null,
    role = null,
    content = null,
    name = null,
    functionCall = null,
    createdAt = null,
    updatedAt = null,
  }: FieldsOf<GPTConversationEntry>) {
    this.id = id;
    this.conversationId = conversationId;
    this.index = index;
    this.role = role;
    this.content = content;
    this.name = name;
    this.functionCall =
      typeof functionCall === 'object'
        ? functionCall
        : JSON.parse(functionCall || null);
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class GPTConversation {
  id?: UUID;
  accountId: UUID;
  roomId?: UUID;
  model: string;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  createdAt: Date;
  updatedAt?: Date;
  messages: GPTConversationEntry[];

  constructor({
    id = null,
    accountId = null,
    roomId = null,
    model = null,
    temperature = null,
    topP = null,
    presencePenalty = null,
    frequencyPenalty = null,
    createdAt = new Date(),
    updatedAt = null,
    messages = [],
  }: FieldsOf<GPTConversation>) {
    this.id = id;
    this.accountId = accountId;
    this.roomId = roomId;
    this.model = model;
    this.temperature = temperature;
    this.topP = topP;
    this.presencePenalty = presencePenalty;
    this.frequencyPenalty = frequencyPenalty;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.messages = messages.map((v) =>
      verifyInstance(GPTConversationEntry, v),
    );
  }
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class GPTConversationService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    endpoint: '/gpt-conversation',

    all: '/all',
    addMessage: '/add-message',
    deleteMessages: '/delete-messages',
  };

  constructor(private httpClient: HttpClient) {
    super();
  }

  update(conversation: GPTConversation) {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}/`;
    return this.httpClient
      .post<GPTConversation>(
        url,
        {
          ...conversation,
          messages: conversation.messages.map((v) => this.store(v)),
        },
        httpOptions,
      )
      .pipe(map((v) => verifyInstance(GPTConversation, v)));
  }

  patch(id: GPTConversation['id'], body: Partial<GPTConversation>) {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}/${id}`;
    return this.httpClient
      .patch<GPTConversation>(url, body, httpOptions)
      .pipe(map((v) => verifyInstance(GPTConversation, v)));
  }

  delete(conversationId: GPTConversation['id']) {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}/${conversationId}`;
    return this.httpClient.delete<void>(url, httpOptions);
  }

  getAllForUser() {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}${this.apiUrl.all}`;
    return this.httpClient
      .get<GPTConversation[]>(url, httpOptions)
      .pipe(map((v) => v.map((e) => verifyInstance(GPTConversation, e))));
  }

  addMessage(entry: GPTConversationEntry) {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}${this.apiUrl.addMessage}`;
    return this.httpClient
      .post<GPTConversationEntry>(url, this.store(entry), httpOptions)
      .pipe(map((v) => verifyInstance(GPTConversationEntry, v)));
  }

  deleteMessages(conversationId: GPTConversation['id'], index: number) {
    const url = `${this.apiUrl.base}${this.apiUrl.endpoint}${this.apiUrl.deleteMessages}/${conversationId}/${index}`;
    return this.httpClient.delete<void>(url, httpOptions);
  }

  private store(entry: GPTConversationEntry) {
    return {
      ...entry,
      functionCall: entry.functionCall
        ? JSON.stringify(entry.functionCall)
        : entry.functionCall,
    };
  }
}
