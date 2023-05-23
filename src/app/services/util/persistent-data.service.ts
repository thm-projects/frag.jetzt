import { Injectable, Injector } from '@angular/core';
import { DB_CONFIG } from 'indexeddb';
import { Key, NgxIndexedDBService, ObjectStoreMeta } from 'ngx-indexed-db';
import { Observable, ReplaySubject, mergeMap, of, take } from 'rxjs';

interface DataAccess {
  bulkAdd<T>(
    storeName: string,
    values: Array<
      T & {
        key?: any;
      }
    >,
  ): Observable<any>;
  update<T>(storeName: string, value: T): Observable<T>;
  getAll<T>(storeName: string): Observable<T[]>;
  getAllByIndex<T>(
    storeName: string,
    indexName: string,
    keyRange: IDBKeyRange,
  ): Observable<T[]>;
  deleteByKey(storeName: string, key: Key): Observable<boolean>;
  bulkGet<T>(storeName: string, keys: Array<IDBValidKey>): any;
  getByKey<T>(storeName: string, key: IDBValidKey): Observable<T>;
}

const dataTypeMeta: { [key: string]: ObjectStoreMeta } = {};

DB_CONFIG.objectStoresMeta.forEach((meta) => {
  dataTypeMeta[meta.store] = meta;
});

class LocalDataAccess implements DataAccess {
  bulkAdd<T>(
    storeName: string,
    values: Array<T & { key?: any }>,
  ): Observable<any> {
    const meta = this.getMeta(storeName);
    values.forEach((value) => this.insert(storeName, value, meta, false));
    return of(true);
  }

  update<T>(storeName: string, value: T): Observable<T> {
    this.insert(storeName, value);
    return of(value);
  }

  getAll<T>(storeName: string): Observable<T[]> {
    this.getMeta(storeName);
    const result = [];
    const prefix = this.makeIdentifier(storeName, '');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        result.push(JSON.parse(localStorage.getItem(key)));
      }
    }
    return of(result);
  }

  deleteByKey(storeName: string, key: Key): Observable<boolean> {
    return of(this.delete(storeName, key));
  }

  getAllByIndex<T>(
    storeName: string,
    indexName: string,
    keyRange: IDBKeyRange,
  ): Observable<T[]> {
    const meta = this.getMeta(storeName);
    const entry = meta.storeSchema.find((x) => x.name === indexName);
    if (!entry) {
      throw new Error(
        'Store ' + storeName + ' does not have an index named ' + indexName,
      );
    }
    if (keyRange.lower !== keyRange.upper) {
      throw new Error('Not implemented!');
    }
    const result = [];
    const key = `idb-${storeName}-${indexName}.${keyRange.lower}`;
    const raw = localStorage.getItem(key);
    if (entry.options?.unique) {
      if (raw) {
        result.push(
          JSON.parse(localStorage.getItem(this.makeIdentifier(storeName, raw))),
        );
      }
    } else {
      const arr = JSON.parse(raw) || [];
      arr.forEach((key) => {
        result.push(
          JSON.parse(localStorage.getItem(this.makeIdentifier(storeName, key))),
        );
      });
    }
    return of(result);
  }

  bulkGet<T>(storeName: string, keys: IDBValidKey[]) {
    this.getMeta(storeName);
    const result = [];
    keys.forEach((key) => {
      const id = typeof key === 'string' ? key : (key as string[]).join('.');
      const locId = this.makeIdentifier(storeName, id);
      result.push(JSON.parse(localStorage.getItem(locId)));
    });
    return of(result);
  }

  getByKey<T>(storeName: string, key: IDBValidKey): Observable<T> {
    this.getMeta(storeName);
    const id = typeof key === 'string' ? key : (key as string[]).join('.');
    const locId = this.makeIdentifier(storeName, id);
    return of(JSON.parse(localStorage.getItem(locId)));
  }

  private getMeta(store: string) {
    const meta = dataTypeMeta[store];
    if (!meta) {
      throw new Error('Store with name ' + store + ' not present.');
    }
    return meta;
  }

  private delete(store: string, keyPath: Key): boolean {
    const meta = this.getMeta(store);
    const id =
      typeof keyPath === 'string' ? keyPath : (keyPath as string[]).join('.');
    const locId = this.makeIdentifier(store, id);
    const data = localStorage.getItem(locId);
    if (!data) {
      return false;
    }
    localStorage.removeItem(locId);
    this.deleteSchema(store, meta, data, id);
    return true;
  }

  private insert(
    store: string,
    value: any,
    meta?: ObjectStoreMeta,
    allowPresent = true,
  ) {
    if (!meta) {
      meta = this.getMeta(store);
    }
    const id = this.getId(meta.storeConfig.keyPath, value);
    const locId = this.makeIdentifier(store, id);
    if (!allowPresent && localStorage.getItem(locId)) {
      throw new Error('Already present!');
    }
    this.updateSchema(store, meta, value, id);
    localStorage.setItem(locId, JSON.stringify(value));
  }

  private deleteSchema(
    store: string,
    meta: ObjectStoreMeta,
    value: any,
    valueId: string,
  ) {
    meta.storeSchema.forEach((schema) => {
      const isUnique = Boolean(schema.options?.unique);
      const key = `idb-${store}-${schema.name}.${this.getId(
        schema.keypath,
        value,
      )}`;
      if (isUnique) {
        localStorage.removeItem(key);
      } else {
        const arr: string[] = JSON.parse(localStorage.getItem(key)) || [];
        localStorage.setItem(
          key,
          JSON.stringify(arr.filter((x) => x !== valueId)),
        );
      }
    });
  }

  private updateSchema(
    store: string,
    meta: ObjectStoreMeta,
    value: any,
    valueId: string,
  ): void {
    meta.storeSchema.forEach((schema) => {
      const isUnique = Boolean(schema.options?.unique);
      const key = `idb-${store}-${schema.name}.${this.getId(
        schema.keypath,
        value,
      )}`;
      const oldVal = localStorage.getItem(key);
      if (isUnique) {
        if (Boolean(oldVal) && oldVal !== valueId) {
          throw new Error(
            schema.name + ' for store ' + store + ' should be unique!',
          );
        }
        localStorage.setItem(key, valueId);
      } else {
        const arr = (JSON.parse(oldVal) as any[]) || [];
        if (!arr.includes(valueId)) {
          arr.push(valueId);
        }
        localStorage.setItem(key, JSON.stringify(arr));
      }
    });
  }

  private makeIdentifier(store: string, id: string): string {
    return `idb-${store}.${id}`;
  }

  private getId(keyPath: string | string[], value: any): string {
    if (Array.isArray(keyPath)) {
      return keyPath.map((x) => value[x]).join('.');
    } else {
      return String(value[keyPath]);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class PersistentDataService implements DataAccess {
  private readonly access = new ReplaySubject<DataAccess>(1);

  constructor(injector: Injector) {
    const request = indexedDB.open('frag.jetzt');
    request.onerror = () => {
      this.access.next(new LocalDataAccess());
    };
    request.onsuccess = (e) => {
      e.target['result'].close();
      this.access.next(injector.get(NgxIndexedDBService));
    };
  }

  bulkAdd<T>(
    storeName: string,
    values: (T & { key?: any })[],
  ): Observable<any> {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.bulkAdd<T>(storeName, values)),
    );
  }

  update<T>(storeName: string, value: T): Observable<T> {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.update<T>(storeName, value)),
    );
  }

  getAll<T>(storeName: string): Observable<T[]> {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.getAll<T>(storeName)),
    );
  }

  getAllByIndex<T>(
    storeName: string,
    indexName: string,
    keyRange: IDBKeyRange,
  ): Observable<T[]> {
    return this.access.pipe(
      take(1),
      mergeMap((access) =>
        access.getAllByIndex<T>(storeName, indexName, keyRange),
      ),
    );
  }

  deleteByKey(storeName: string, key: Key): Observable<boolean> {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.deleteByKey(storeName, key)),
    );
  }

  bulkGet<T>(storeName: string, keys: IDBValidKey[]) {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.bulkGet<T>(storeName, keys)),
    );
  }

  getByKey<T>(storeName: string, key: IDBValidKey): Observable<T> {
    return this.access.pipe(
      take(1),
      mergeMap((access) => access.getByKey<T>(storeName, key)),
    );
  }
}
