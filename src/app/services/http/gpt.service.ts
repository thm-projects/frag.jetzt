import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpEventType,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTCompletion } from 'app/models/gpt-completion';
import { GPTConfiguration } from 'app/models/gpt-configuration';
import { GPTRating } from 'app/models/gpt-rating';
import { GPTRoomPreset } from 'app/models/gpt-room-preset';
import {
  GPTRoomSetting,
  GPTRoomUsageTime,
  UsageRepeatUnit,
} from 'app/models/gpt-room-setting';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { GPTPlatformStatus, GPTRoomStatus } from 'app/models/gpt-status';
import { RatingResult } from 'app/models/rating-result';
import { verifyInstance } from 'app/utils/ts-utils';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { BaseHttpService } from './base-http.service';

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

interface GPTPrompt {
  roomId?: string;
  model: string;
  prompt: string;
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

interface GPTModerationResult {
  flagged: boolean;
  flaggedCategories: string[];
}

interface GPTEndStreamEntry {
  finished: true;
  moderationResults: GPTModerationResult[];
  finishReasons: string[];
}

interface GPTDataStreamEntry {
  text: string;
  index: number;
}

export type GPTStreamResult = GPTEndStreamEntry | GPTDataStreamEntry;

interface BlockingCompletion {
  completion: GPTCompletion;
  moderationResults: GPTModerationResult[];
}

interface CachedModelData {
  categories: string[];
  costPerToken: number;
  endpoint: string;
  betterEndpoint: string;
  reference: string;
  betterModel: string;
  deprecated: boolean;
  allowSuffix: boolean;
  alpha: boolean;
  common: boolean;
  preferred: boolean;
  maxInputTokens: number;
  embeddingOutputDimension: number;
  contextTokens: number;
}

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

export interface CachedModel {
  name: string;
  model: CachedModelData;
}

interface UsageTimeActionDelete {
  deleteId: string;
}

interface UsageTimeActionAdd {
  repeatDuration: number | null;
  repeatUnit: UsageRepeatUnit | null;
  startDate: Date;
  endDate: Date;
}

export type UsageTimeAction = UsageTimeActionDelete | UsageTimeActionAdd;

@Injectable({
  providedIn: 'root',
})
export class GptService extends BaseHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  getCompletionModelsOnce(): Observable<CachedModel[]> {
    const url = '/api/gpt/completion-models';
    return this.httpClient.get<CachedModel[]>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<CachedModel[]>('getCompletionModelsOnce')),
    );
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

  requestCompletion(prompt: GPTPrompt): Observable<BlockingCompletion> {
    const url = '/api/gpt/completion';
    return this.httpClient
      .post<BlockingCompletion>(url, prompt, httpOptions)
      .pipe(
        tap((_) => ''),
        map((v) => {
          v.completion = verifyInstance(GPTCompletion, v.completion);
          return v;
        }),
        catchError(this.handleError<BlockingCompletion>('requestCompletion')),
      );
  }

  requestStreamCompletion(prompt: GPTPrompt): Observable<GPTStreamResult> {
    const url = '/api/gpt/stream-completion';
    const request = new HttpRequest('POST', url, prompt, {
      reportProgress: true,
      responseType: 'text',
    });
    let lastSize = 0;
    let remainingString = '';
    return this.httpClient.request(request).pipe(
      tap((_) => ''),
      switchMap((event) => {
        if (event.type === HttpEventType.DownloadProgress) {
          const text = event['partialText'] as string;
          if (!Boolean(text)) {
            return of();
          }
          remainingString += text.slice(lastSize);
          lastSize = text.length;
          return this.extractData(
            remainingString,
            (s) => (remainingString = s),
          );
        } else if (event.type === HttpEventType.Response) {
          const text = event.body as string;
          remainingString += text.slice(lastSize);
          return this.extractData(
            remainingString,
            (s) => (remainingString = s),
          );
        }
        return of();
      }),
      catchError(this.handleError<GPTStreamResult>('requestStreamCompletion')),
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

  getStatusForRoom(roomId: string): Observable<GPTRoomStatus> {
    const url = '/api/gpt/status/' + roomId;
    return this.httpClient.get<GPTRoomStatus>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTRoomStatus, v)),
      catchError(this.handleError<GPTRoomStatus>('getStatusForRoom')),
    );
  }

  getStatus(): Observable<GPTPlatformStatus> {
    const url = '/api/gpt/plain-status';
    return this.httpClient.get<GPTPlatformStatus>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTPlatformStatus, v)),
      catchError(this.handleError<GPTPlatformStatus>('getStatus')),
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

  private extractData(
    data: string,
    updater: (str: string) => void,
  ): Observable<GPTStreamResult> {
    let lastIndex = 0;
    let currentIndex = 0;
    const resultArr = [];
    while ((currentIndex = data.indexOf('\n\n', lastIndex)) >= 0) {
      resultArr.push(JSON.parse(data.slice(lastIndex + 5, currentIndex)));
      lastIndex = currentIndex + 2;
    }
    if (lastIndex > 0) {
      updater(data.slice(lastIndex));
    }
    return of(...resultArr);
  }
}
