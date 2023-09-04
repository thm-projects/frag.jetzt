import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Observable, catchError, map, tap } from 'rxjs';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { UUID, verifyInstance } from 'app/utils/ts-utils';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export type KeycloakProviderAPI = Omit<
  KeycloakProvider,
  'id' | 'createdAt' | 'updatedAt'
>;

@Injectable({
  providedIn: 'root',
})
export class KeycloakProviderService extends BaseHttpService {
  private apiUrl = {
    base: '/api/keycloak-provider',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<KeycloakProvider[]> {
    const url = `${this.apiUrl.base}/providers/all`;
    return this.http.get<KeycloakProvider[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((providers) =>
        providers.map((provider) => verifyInstance(KeycloakProvider, provider)),
      ),
      catchError(this.handleError<KeycloakProvider[]>('getAll')),
    );
  }

  getById(uuid: UUID): Observable<KeycloakProvider> {
    const url = `${this.apiUrl.base}/${uuid}`;
    return this.http.get<KeycloakProvider>(url, httpOptions).pipe(
      tap(() => ''),
      map((provider) => verifyInstance(KeycloakProvider, provider)),
      catchError(this.handleError<KeycloakProvider>('getById')),
    );
  }

  patch(uuid: UUID, changes: Partial<KeycloakProviderAPI>) {
    const url = `${this.apiUrl.base}/${uuid}`;
    return this.http.patch<KeycloakProvider>(url, changes, httpOptions).pipe(
      tap(() => ''),
      map((provider) => verifyInstance(KeycloakProvider, provider)),
      catchError(this.handleError<KeycloakProvider>('patch')),
    );
  }

  create(provider: KeycloakProviderAPI): Observable<KeycloakProvider> {
    const url = `${this.apiUrl.base}/`;
    return this.http.post<KeycloakProvider>(url, provider, httpOptions).pipe(
      tap(() => ''),
      map((provider) => verifyInstance(KeycloakProvider, provider)),
      catchError(this.handleError<KeycloakProvider>('create')),
    );
  }

  delete(uuid: UUID): Observable<void> {
    const url = `${this.apiUrl.base}/${uuid}`;
    return this.http.delete<void>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('delete')),
    );
  }
}
