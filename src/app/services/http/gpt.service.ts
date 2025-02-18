import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTConfiguration } from 'app/models/gpt-configuration';
import { GPTRating } from 'app/models/gpt-rating';
import { GPTRoomPreset } from 'app/models/gpt-room-preset';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { RatingResult } from 'app/models/rating-result';
import { UUID, verifyInstance } from 'app/utils/ts-utils';
import { catchError, finalize, map, Observable, tap } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { postSSE } from 'app/utils/sse-client';

export interface GPTModel {
  name: string;
  endpoints: ('ASSISTANT_WITH_RETRIEVAL' | 'ASSISTANT' | 'CHAT')[];
  costPerPromptToken: number;
  costPerCompletionToken: number;
  maxTokens: number;
  maxOutputTokens: number;
  interruptTokens: number;
  encoderName: string;
}

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),
};

const httpOptionsPlainString = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),
  responseType: 'text',
} as const;

export interface TextCompletionRequest {
  roomId?: UUID;
  model: 'text-davinci-003' | 'text-davinci-002' | 'code-davinci-002';
  prompt: string[];
  suffix?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  n?: number;
  logprobs?: number;
  echo?: boolean;
  stop?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  bestOf?: number;
  logitBias?: { [key: string]: number };
}

export const ChatCompletionModels = ['gpt-3.5-turbo', 'gpt-4o'] as const;

export interface ChatCompletionRequest {
  roomId?: UUID;
  model: (typeof ChatCompletionModels)[number];
  messages: ChatCompletionMessage[];
  temperature?: number;
  topP?: number;
  n?: number;
  stop?: string[];
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: { [key: string]: number };
}

export interface TextCompletionChoice {
  index: number;
  finishReason: string;
  text: string;
  logprobs: {
    textOffset: number[];
    tokenLogprobs: number[];
    tokens: string[];
    topLogprobs: { [key: string]: number };
  };
}

export interface ChatCompletionMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
  name?: 'example_user' | 'example_assistant';
}

export interface ChatCompletionChoice {
  index: number;
  finishReason: string;
  message: ChatCompletionMessage;
}

export interface ChatCompletionDeltaChoice {
  index: number;
  finishReason: string;
  delta: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  };
}

export interface CompletionResponse<T> {
  id: string;
  object: string;
  created: Date;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  choices: T[];
}

export interface ModerationResponse {
  id: string;
  model: string;
  results: {
    categories: { [key: string]: boolean };
    categoryScores: { [key: string]: number };
    flagged: boolean;
  }[];
}

export interface ModerationMarker {
  done: true;
  response: ModerationResponse;
}

export interface ModerationWrapped<T> {
  completion: T;
  response: ModerationResponse;
}

export interface GlobalAccessInfo {
  blocked: boolean;
  registered: boolean;
  globalActive: boolean;
  apiKeyPresent: boolean;
  apiEnabled: boolean;
  apiExpired: boolean;
  consented: boolean;
  restricted: boolean;
}

export interface RoomAccessInfo {
  globalInfo: GlobalAccessInfo;
  apiKeyPresent: boolean;
  roomOwnerRegistered: boolean;
  usingTrial: boolean;
  roomDisabled: boolean;
  moderatorDisabled: boolean;
  participantDisabled: boolean;
  usageTimeOver: boolean;
  isMod: boolean;
  isOwner: boolean;
  restricted: boolean;
}

export interface PropmtPresetAdd {
  act: string;
  prompt: string;
  language: string;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
  topP: number;
}

export type StreamTextCompletion =
  | CompletionResponse<TextCompletionChoice>
  | ModerationMarker;
export type BlockedTextCompletion = ModerationWrapped<
  CompletionResponse<TextCompletionChoice>
>;
export type StreamChatCompletion =
  | CompletionResponse<ChatCompletionDeltaChoice>
  | ModerationMarker;
export type BlockedChatCompletion = ModerationWrapped<
  CompletionResponse<ChatCompletionChoice>
>;

@Injectable({
  providedIn: 'root',
})
export class GptService extends BaseHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  getValidModels(): Observable<GPTModel[]> {
    const url = '/api/gpt/models';
    return this.httpClient.get<GPTModel[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<GPTModel[]>('getValidModels')),
    );
  }

  getPreset(roomId: string): Observable<GPTRoomPreset> {
    const url = '/api/gpt/room-preset/' + roomId;
    return this.httpClient.get<GPTRoomPreset>(url, httpOptions).pipe(
      tap(() => ''),
      map((data) => verifyInstance(GPTRoomPreset, data)),
      catchError(this.handleError<GPTRoomPreset>('getPreset')),
    );
  }

  patchPreset(
    roomId: string,
    changes: Partial<GPTRoomPreset>,
  ): Observable<GPTRoomPreset> {
    const url = '/api/gpt/room-preset/' + roomId;
    return this.httpClient.patch<GPTRoomPreset>(url, changes, httpOptions).pipe(
      tap(() => ''),
      map((data) => verifyInstance(GPTRoomPreset, data)),
      catchError(this.handleError<GPTRoomPreset>('patchPreset')),
    );
  }

  getConsentState(): Observable<boolean | null> {
    const url = '/api/gpt/gdpr';
    return this.httpClient.get(url, httpOptionsPlainString).pipe(
      tap(() => ''),
      map((str) => {
        if (str === 'null') {
          return null;
        } else if (str === 'false') {
          return false;
        } else {
          return true;
        }
      }),
      catchError(this.handleError<boolean>('getConsentState')),
    );
  }

  updateConsentState(consented: boolean): Observable<boolean | null> {
    const url = '/api/gpt/gdpr';
    return this.httpClient
      .post(url, { consentState: consented }, httpOptionsPlainString)
      .pipe(
        tap(() => ''),
        map((str) => {
          if (str === 'null') {
            return null;
          } else if (str === 'false') {
            return false;
          } else {
            return true;
          }
        }),
        catchError(this.handleError<boolean>('updateConsentState')),
      );
  }

  getConfiguration(): Observable<GPTConfiguration> {
    const url = '/api/gpt/config';
    return this.httpClient.get<GPTConfiguration>(url, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(GPTConfiguration, v['config'])),
      catchError(this.handleError<GPTConfiguration>('getConfiguration')),
    );
  }

  patchConfiguration(changes: Partial<GPTConfiguration>): Observable<void> {
    const url = '/api/gpt/config';
    return this.httpClient.patch<void>(url, { changes }, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('patchConfiguration')),
    );
  }

  requestCompletion(
    prompt: TextCompletionRequest,
  ): Observable<BlockedTextCompletion> {
    const url = '/api/gpt/completion';
    return this.httpClient
      .post<BlockedTextCompletion>(url, prompt, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<BlockedTextCompletion>('requestCompletion'),
        ),
        finalize(() => {
          this.abortStreamCompletion().subscribe();
        }),
      );
  }

  requestStreamCompletion(
    prompt: TextCompletionRequest,
  ): Observable<StreamTextCompletion> {
    const url = '/api/gpt/stream-completion';
    return postSSE(this.httpClient, url, prompt).pipe(
      tap(() => ''),
      map((event) => event.jsonData() as StreamTextCompletion),
      catchError(
        this.handleError<StreamTextCompletion>('requestStreamCompletion'),
      ),
      finalize(() => {
        this.abortStreamCompletion().subscribe();
      }),
    );
  }

  requestChat(
    prompt: ChatCompletionRequest,
  ): Observable<BlockedChatCompletion> {
    const url = '/api/gpt/chat/completion';
    return this.httpClient
      .post<BlockedChatCompletion>(url, prompt, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<BlockedChatCompletion>('requestChat')),
        finalize(() => {
          this.abortStreamCompletion().subscribe();
        }),
      );
  }

  requestChatStream(
    prompt: ChatCompletionRequest,
  ): Observable<StreamChatCompletion> {
    const url = '/api/gpt/chat/stream-completion';
    return postSSE(this.httpClient, url, prompt).pipe(
      tap(() => ''),
      map((event) => event.jsonData() as StreamChatCompletion),
      catchError(this.handleError<StreamChatCompletion>('requestChatStream')),
      finalize(() => {
        this.abortStreamCompletion().subscribe();
      }),
    );
  }

  abortStreamCompletion(): Observable<boolean> {
    const url = '/api/gpt/interrupt-stream';
    return this.httpClient.post<boolean>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<boolean>('abortStreamCompletion')),
    );
  }

  getStatusForRoom(roomId: string): Observable<RoomAccessInfo> {
    const url = '/api/gpt/status/' + roomId;
    return this.httpClient.get<RoomAccessInfo>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<RoomAccessInfo>('getStatusForRoom')),
    );
  }

  getStatus(): Observable<GlobalAccessInfo> {
    const url = '/api/gpt/plain-status';
    return this.httpClient.get<GlobalAccessInfo>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<GlobalAccessInfo>('getStatus')),
    );
  }

  makeRating(rating: number, ratingText: string): Observable<GPTRating> {
    const url = '/api/gpt/rating';
    return this.httpClient
      .post<GPTRating>(url, { rating, ratingText }, httpOptions)
      .pipe(
        tap(() => ''),
        map((v) => verifyInstance(GPTRating, v)),
        catchError(this.handleError<GPTRating>('makeRating')),
      );
  }

  getRating(): Observable<GPTRating> {
    const url = '/api/gpt/rating';
    return this.httpClient.get<GPTRating>(url, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(GPTRating, v)),
      catchError(this.handleError<GPTRating>('getRating')),
    );
  }

  getRatingTexts(): Observable<string[]> {
    const url = '/api/gpt/rating-texts';
    return this.httpClient.get<string[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<string[]>('getRatingTexts')),
    );
  }

  getRatingInfo(): Observable<RatingResult> {
    const url = '/api/gpt/rating-info';
    return this.httpClient.get<RatingResult>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<RatingResult>('getRatingInfo')),
    );
  }

  getStats(): Observable<GPTStatistics> {
    const url = '/api/gpt/stats';
    return this.httpClient.get<GPTStatistics>(url, httpOptions).pipe(
      tap(() => ''),
      map((v) => verifyInstance(GPTStatistics, v)),
      catchError(this.handleError<GPTStatistics>('getStats')),
    );
  }
}
