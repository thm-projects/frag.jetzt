import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTCompletion } from 'app/models/gpt-completion';
import { GPTConfiguration } from 'app/models/gpt-configuration';
import { GPTModels } from 'app/models/gpt-models';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { verifyInstance } from 'app/utils/ts-utils';
import {
  catchError,
  filter,
  map,
  Observable,
  ReplaySubject,
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
  USERS = 'USERS',
}

export class GPTStatus {
  restricted: boolean;
  usage: GPTUsage;

  constructor({
    restricted = true,
    usage = GPTUsage.REGISTERED_MODERATORS,
  }: GPTStatus) {
    this.restricted = restricted;
    this.usage = usage;
  }
}

interface GPTPrompt {
  prompt: null | string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class GptService extends BaseHttpService {
  private models = new ReplaySubject<GPTModels>(1);

  constructor(
    private httpClient: HttpClient,
    private userManagementService: UserManagementService,
  ) {
    super();
    userManagementService
      .getUser()
      .pipe(
        filter((u) => u?.isSuperAdmin),
        take(1),
      )
      .subscribe(() => this.refreshModels());
  }

  getModelsOnce(): Observable<GPTModels> {
    return this.models.pipe(take(1));
  }

  refreshModels(): void {
    if (!this.userManagementService.getCurrentUser()?.isSuperAdmin) {
      return;
    }
    this.getModels().subscribe({
      next: (m) => this.models.next(m),
      error: (e) => this.models.error(e),
    });
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

  requestCompletion(prompt: GPTPrompt): Observable<GPTCompletion> {
    const url = '/api/gpt/completion';
    return this.httpClient.post<GPTCompletion>(url, prompt, httpOptions).pipe(
      tap((_) => ''),
      map((v) => verifyInstance(GPTCompletion, v)),
      catchError(this.handleError<GPTCompletion>('requestCompletion')),
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

  private getModels(): Observable<GPTModels> {
    const url = '/api/gpt/models';
    return this.httpClient.get<GPTModels>(url, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<GPTModels>('getModels')),
    );
  }
}
