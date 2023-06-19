import { Injectable } from '@angular/core';

/**
 * Service for storing local user data.
 * Use this service to allow switching between localStorage, cookies, .. easily.
 */
@Injectable()
export class DataStoreService {
  private isObject = false;
  private db = {};

  constructor() {
    this.isObject = !globalThis['localStorage'];
  }

  has(key: string): boolean {
    if (this.isObject) {
      return key in this.db;
    }
    return key in localStorage;
  }

  get(key: string): string {
    if (this.isObject) {
      return this.db[key];
    }
    return localStorage.getItem(key);
  }

  set(key: string, data: string) {
    if (this.isObject) {
      this.db[key] = data;
      return;
    }
    localStorage.setItem(key, data);
  }

  remove(key: string) {
    if (this.isObject) {
      this.db[key] = undefined;
      return;
    }
    localStorage.removeItem(key);
  }
}
