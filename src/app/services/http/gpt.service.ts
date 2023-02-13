import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpEventType,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTCompletion } from 'app/models/gpt-completion';
import { GPTConfiguration } from 'app/models/gpt-configuration';
import { GPTModels } from 'app/models/gpt-models';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { verifyInstance } from 'app/utils/ts-utils';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { UserManagementService } from '../util/user-management.service';
import { BaseHttpService } from './base-http.service';

/* eslint-disable @typescript-eslint/naming-convention */
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

export enum GPTUsage {
  REGISTERED_MODERATORS = 'REGISTERED_MODERATORS',
  REGISTERED_USERS = 'REGISTERED_USERS',
}

export class GPTStatus {
  restricted: boolean;
  apiSetup: boolean;
  usage: GPTUsage;
  // suggestion
  maxTokens?: number;
  contextTokens: number;
  availableTokens: number;

  constructor({
    restricted = true,
    apiSetup = false,
    usage = GPTUsage.REGISTERED_MODERATORS,
    maxTokens = null,
    contextTokens = 2048,
    availableTokens = 0,
  }: GPTStatus) {
    this.restricted = restricted;
    this.apiSetup = apiSetup;
    this.usage = usage;
    this.maxTokens = maxTokens;
    this.contextTokens = contextTokens;
    this.availableTokens = availableTokens;
  }
}

interface GPTPrompt {
  prompt: null | string | string[];
}

interface GPTModerationResult {
  flagged: boolean;
  flaggedCategories: string[];
}

interface GPTEndStreamEntry {
  finished: true;
  moderationResults: GPTModerationResult[];
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

export interface CachedModel {
  name: string;
  model: CachedModelData;
}

@Injectable({
  providedIn: 'root',
})
export class GptService extends BaseHttpService {
  private models = new ReplaySubject<GPTModels>(1);
  private needsRequest = true;

  constructor(
    private httpClient: HttpClient,
    private userManagementService: UserManagementService,
  ) {
    super();
  }

  getCompletionModelsOnce(): Observable<CachedModel[]> {
    const url = '/api/gpt/completion-models';
    return this.httpClient.get<CachedModel[]>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<CachedModel[]>('getCompletionModelsOnce')),
    );
  }

  getModelsOnce(): Observable<GPTModels> {
    this.refreshModels();
    return this.models.pipe(take(1));
  }

  getStatus(): Observable<GPTStatus> {
    const url = '/api/gpt/status';
    return this.httpClient.get<GPTStatus>(url, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTStatus, v)),
      catchError(this.handleError<GPTStatus>('getStatus')),
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
      headers: httpOptions.headers,
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

  private refreshModels(): void {
    if (
      !this.userManagementService.getCurrentUser()?.isSuperAdmin ||
      !this.needsRequest
    ) {
      return;
    }
    this.needsRequest = false;
    this.getModels().subscribe({
      next: (m) => this.models.next(m),
      error: (e) => {
        this.needsRequest = true;
        this.models.error(e);
      },
    });
  }

  private getModels(): Observable<GPTModels> {
    const url = '/api/gpt/models';
    return this.httpClient.get<GPTModels>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<GPTModels>('getModels')),
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
