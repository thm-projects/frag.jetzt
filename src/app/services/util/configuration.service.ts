import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PersistentDataService } from './persistent-data.service';

export const CONFIGURATION_KEYS = [
  'language',
  'theme',
  'guestAccount',
  'currentAccount',
  'cookieAccepted',
] as const;

export type ConfigurationKey = (typeof CONFIGURATION_KEYS)[number];

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  constructor(private persistentDataService: PersistentDataService) {}

  get(...keys: ConfigurationKey[]): Observable<any[]> {
    return (
      this.persistentDataService.bulkGet('config', keys) as Observable<any[]>
    ).pipe(map((data) => data.map((datum) => datum?.value)));
  }

  put<T>(key: ConfigurationKey, value: T): Observable<T> {
    return this.persistentDataService
      .update('config', { key, value })
      .pipe(map((data) => data?.value));
  }
}
