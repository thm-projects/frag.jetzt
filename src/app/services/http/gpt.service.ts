import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTConfiguration } from 'app/models/gpt-configuration';
import { GPTPromptPreset } from 'app/models/gpt-prompt-preset';
import { GPTRating } from 'app/models/gpt-rating';
import { GPTRoomPreset } from 'app/models/gpt-room-preset';
import {
  GPTRoomSetting,
  GPTRoomUsageTime,
  UsageRepeatUnit,
} from 'app/models/gpt-room-setting';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { RatingResult } from 'app/models/rating-result';
import { UUID, verifyInstance } from 'app/utils/ts-utils';
import { catchError, finalize, map, Observable, tap } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { postSSE } from 'app/utils/sse-client';

/* eslint-disable @typescript-eslint/naming-convention */
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

export type GPTRoomSettingAPI = Pick<
  GPTRoomSetting,
  | 'apiKey'
  | 'apiOrganization'
  | 'maxDailyRoomCost'
  | 'maxMonthlyRoomCost'
  | 'maxAccumulatedRoomCost'
  | 'maxDailyParticipantCost'
  | 'maxMonthlyParticipantCost'
  | 'maxAccumulatedParticipantCost'
  | 'maxDailyModeratorCost'
  | 'maxMonthlyModeratorCost'
  | 'maxAccumulatedModeratorCost'
  | 'rightsBitset'
>;

interface UsageTimeActionDelete {
  deleteId: string;
}

interface UsageTimeActionAdd {
  repeatDuration: number | null;
  repeatUnit: UsageRepeatUnit | null;
  startDate: Date;
  endDate: Date;
}

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

export interface ChatCompletionRequest {
  roomId?: UUID;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-32k';
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

export interface Model {
  name: string;
  costPerPromptToken: number;
  costPerCompletionToken: number;
  maxTokens: number;
  interruptTokens: number;
  encoderName: string;
}

export interface GlobalAccessInfo {
  blocked: boolean;
  registered: boolean;
  apiKeyPresent: boolean;
  apiEnabled: boolean;
  apiExpired: boolean;
  consented: boolean;
  restricted: boolean;
}

export interface RoomAccessInfo {
  globalInfo: GlobalAccessInfo;
  apiKeyPresent: boolean;
  usingTrial: boolean;
  roomDisabled: boolean;
  moderatorDisabled: boolean;
  participantDisabled: boolean;
  usageTimeOver: boolean;
  isMod: boolean;
  isOwner: boolean;
  restricted: boolean;
}

export type UsageTimeAction = UsageTimeActionDelete | UsageTimeActionAdd;

interface PropmtPresetAdd {
  act: string;
  prompt: string;
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

  getModels(): Model[] {
    return [
      {
        name: 'gpt-4-32k',
        costPerPromptToken: 6000,
        costPerCompletionToken: 12000,
        maxTokens: 32768,
        interruptTokens: 8,
        encoderName: 'cl100k',
      },
      {
        name: 'gpt-4',
        costPerPromptToken: 3000,
        costPerCompletionToken: 6000,
        maxTokens: 8192,
        interruptTokens: 8,
        encoderName: 'cl100k',
      },
      {
        name: 'gpt-3.5-turbo',
        costPerPromptToken: 200,
        costPerCompletionToken: 200,
        maxTokens: 4096,
        interruptTokens: 8,
        encoderName: 'cl100k',
      },
      {
        name: 'text-davinci-003',
        costPerPromptToken: 2000,
        costPerCompletionToken: 2000,
        maxTokens: 4097,
        interruptTokens: 5,
        encoderName: 'p50k',
      },
      {
        name: 'text-davinci-002',
        costPerPromptToken: 2000,
        costPerCompletionToken: 2000,
        maxTokens: 4097,
        interruptTokens: 5,
        encoderName: 'p50k',
      },
      {
        name: 'code-davinci-002',
        costPerPromptToken: 2000,
        costPerCompletionToken: 2000,
        maxTokens: 8001,
        interruptTokens: 5,
        encoderName: 'p50k',
      },
    ];
  }

  getRoomSetting(roomId: string): Observable<GPTRoomSetting> {
    const url = '/api/gpt/room-setting/' + roomId;
    return this.httpClient.get<GPTRoomSetting>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTRoomSetting, v)),
      catchError(this.handleError<GPTRoomSetting>('getRoomSetting')),
    );
  }

  patchRoomSetting(
    roomId: string,
    patch: Partial<GPTRoomSettingAPI>,
  ): Observable<GPTRoomSetting> {
    const url = '/api/gpt/room-setting/' + roomId;
    return this.httpClient
      .patch<GPTRoomSetting>(url, { changes: patch }, httpOptions)
      .pipe(
        tap((_) => ''),
        map((v) => verifyInstance(GPTRoomSetting, v)),
        catchError(this.handleError<GPTRoomSetting>('patchRoomSetting')),
      );
  }

  getPreset(roomId: string): Observable<GPTRoomPreset> {
    const url = '/api/gpt/room-preset/' + roomId;
    return this.httpClient.get<GPTRoomPreset>(url, httpOptions).pipe(
      tap((_) => ''),
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
      tap((_) => ''),
      map((data) => verifyInstance(GPTRoomPreset, data)),
      catchError(this.handleError<GPTRoomPreset>('patchPreset')),
    );
  }

  updateUsageTimes(
    roomId: string,
    usageTimes: UsageTimeAction[],
  ): Observable<GPTRoomUsageTime[]> {
    const url = '/api/gpt/room-usage-times/' + roomId;
    return this.httpClient
      .post<GPTRoomUsageTime[]>(url, usageTimes, httpOptions)
      .pipe(
        tap((_) => ''),
        map((data) =>
          data.map((datum) => verifyInstance(GPTRoomUsageTime, datum)),
        ),
        catchError(this.handleError<GPTRoomUsageTime[]>('updateUsageTimes')),
      );
  }

  getUserDescription(roomId: string): Observable<string> {
    const url = '/api/gpt/user-description/' + roomId;
    return this.httpClient.get(url, httpOptionsPlainString).pipe(
      tap((_) => ''),
      catchError(this.handleError<string>('getUserDescription')),
    );
  }

  updateUserDescription(
    roomId: string,
    description: string,
  ): Observable<string> {
    const url = '/api/gpt/user-description/' + roomId;
    return this.httpClient
      .post(url, { description }, httpOptionsPlainString)
      .pipe(
        tap((_) => ''),
        catchError(this.handleError<string>('updateUserDescription')),
      );
  }

  getConsentState(): Observable<boolean | null> {
    const url = '/api/gpt/gdpr';
    return this.httpClient.get(url, httpOptionsPlainString).pipe(
      tap((_) => ''),
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
        tap((_) => ''),
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

  activateTrial(roomId: string, trialCode: string): Observable<boolean> {
    const url = '/api/gpt/activate-trial/' + roomId;
    return this.httpClient.post<boolean>(url, { trialCode }, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<boolean>('activateTrial')),
    );
  }

  getConfiguration(): Observable<GPTConfiguration> {
    const url = '/api/gpt/config';
    return this.httpClient.get<GPTConfiguration>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTConfiguration, v['config'])),
      catchError(this.handleError<GPTConfiguration>('getConfiguration')),
    );
  }

  patchConfiguration(changes: Partial<GPTConfiguration>): Observable<void> {
    const url = '/api/gpt/config';
    return this.httpClient.patch<void>(url, { changes }, httpOptions).pipe(
      tap((_) => ''),
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
        tap((_) => ''),
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
      tap((_) => ''),
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
        tap((_) => ''),
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
      tap((_) => ''),
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
      tap((_) => ''),
      catchError(this.handleError<boolean>('abortStreamCompletion')),
    );
  }

  getStatusForRoom(roomId: string): Observable<RoomAccessInfo> {
    const url = '/api/gpt/status/' + roomId;
    return this.httpClient.get<RoomAccessInfo>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<RoomAccessInfo>('getStatusForRoom')),
    );
  }

  getStatus(): Observable<GlobalAccessInfo> {
    const url = '/api/gpt/plain-status';
    return this.httpClient.get<GlobalAccessInfo>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<GlobalAccessInfo>('getStatus')),
    );
  }

  makeRating(rating: number, ratingText: string): Observable<GPTRating> {
    const url = '/api/gpt/rating';
    return this.httpClient
      .post<GPTRating>(url, { rating, ratingText }, httpOptions)
      .pipe(
        tap((_) => ''),
        map((v) => verifyInstance(GPTRating, v)),
        catchError(this.handleError<GPTRating>('makeRating')),
      );
  }

  getRating(): Observable<GPTRating> {
    const url = '/api/gpt/rating';
    return this.httpClient.get<GPTRating>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTRating, v)),
      catchError(this.handleError<GPTRating>('getRating')),
    );
  }

  getRatingTexts(): Observable<string[]> {
    const url = '/api/gpt/rating-texts';
    return this.httpClient.get<string[]>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<string[]>('getRatingTexts')),
    );
  }

  getRatingInfo(): Observable<RatingResult> {
    const url = '/api/gpt/rating-info';
    return this.httpClient.get<RatingResult>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<RatingResult>('getRatingInfo')),
    );
  }

  getStats(): Observable<GPTStatistics> {
    const url = '/api/gpt/stats';
    return this.httpClient.get<GPTStatistics>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTStatistics, v)),
      catchError(this.handleError<GPTStatistics>('getStats')),
    );
  }

  getPrompts(): Observable<GPTPromptPreset[]> {
    const url = '/api/gpt/prompt-presets';
    return this.httpClient.get<GPTPromptPreset[]>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => v.map((e) => verifyInstance(GPTPromptPreset, e))),
      catchError(this.handleError<GPTPromptPreset[]>('getPrompts')),
    );
  }

  getGlobalPrompts(): Observable<GPTPromptPreset[]> {
    const url = '/api/gpt/global-prompt-presets';
    return this.httpClient.get<GPTPromptPreset[]>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => v.map((e) => verifyInstance(GPTPromptPreset, e))),
      catchError(this.handleError<GPTPromptPreset[]>('getGlobalPrompts')),
    );
  }

  addPrompt(prompt: PropmtPresetAdd): Observable<GPTPromptPreset> {
    const url = '/api/gpt/prompt-preset';
    return this.httpClient.post<GPTPromptPreset>(url, prompt, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTPromptPreset, v)),
      catchError(this.handleError<GPTPromptPreset>('addPrompt')),
    );
  }

  addGlobalPrompt(prompt: PropmtPresetAdd): Observable<GPTPromptPreset> {
    const url = '/api/gpt/global-prompt-preset';
    return this.httpClient.post<GPTPromptPreset>(url, prompt, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTPromptPreset, v)),
      catchError(this.handleError<GPTPromptPreset>('addGlobalPrompt')),
    );
  }

  patchPrompt(
    id: string,
    prompt: Partial<PropmtPresetAdd>,
  ): Observable<GPTPromptPreset> {
    const url = '/api/gpt/prompt-preset/' + id;
    return this.httpClient
      .patch<GPTPromptPreset>(url, prompt, httpOptions)
      .pipe(
        tap((_) => ''),
        map((v) => verifyInstance(GPTPromptPreset, v)),
        catchError(this.handleError<GPTPromptPreset>('patchPrompt')),
      );
  }

  deletePrompt(id: string): Observable<void> {
    const url = '/api/gpt/prompt-preset/' + id;
    return this.httpClient.delete<void>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<void>('deletePrompt')),
    );
  }
}
