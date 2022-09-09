import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const CONFIGURATION_KEYS = [
  'language',
  'theme',
  'guestAccount',
  'currentAccount',
  'cookieAccepted',
] as const;

export type ConfigurationKey = typeof CONFIGURATION_KEYS[number];

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor(
    private indexedDBService: NgxIndexedDBService,
  ) {
  }

  get(...keys: ConfigurationKey[]): Observable<any[]> {
    return (this.indexedDBService.bulkGet('config', keys) as Observable<any[]>).pipe(
      map(data => data.map(datum => datum?.value)),
    );
  }

  put<T>(key: ConfigurationKey, value: T): Observable<T> {
    return this.indexedDBService.update('config', { key, value }).pipe(
      map(data => data?.value),
    );
  }
}
