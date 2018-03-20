import { Injectable } from '@angular/core';

/**
 * Service for storing local user data.
 * Use this service to allow switching between localStorage, cookies, .. easily.
 */
@Injectable()
export class DataStoreService {
  has(key: string): boolean {
    return key in localStorage;
  }

  get(key: string): string {
    return localStorage.getItem(key);
  }

  set(key: string, data: string) {
    localStorage.setItem(key, data);
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }
}
