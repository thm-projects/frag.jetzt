import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTModels } from 'app/models/GPTModels';
import {
  catchError,
  filter,
  Observable,
  of,
  ReplaySubject,
  take,
  tap,
} from 'rxjs';
import { UserManagementService } from '../util/user-management.service';
import { BaseHttpService } from './base-http.service';

/* eslint-disable @typescript-eslint/naming-convention */
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  }),
};

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

  private getModels(): Observable<GPTModels> {
    const url = '/api/gpt/models';
    return this.httpClient.get<GPTModels>(url, httpOptions).pipe(
      tap((_) => console.log(_)),
      catchError(this.handleError<GPTModels>('getModels')),
    );
  }
}
