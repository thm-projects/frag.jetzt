const makeDomList = (arr: string[]): DOMStringList => {
  return new Proxy(arr, {
    get: (target, p, receiver) => {
      console.log(target, p, receiver);
      if (typeof p === 'string') {
        if (p === 'item') {
          return (index: number) => Reflect.get(target, index, receiver);
        } else if (p === 'contains') {
          return (string: string) => target.includes(string);
        }
      }
      return Reflect.get(target, p, receiver);
    },
  }) as unknown as DOMStringList;
};

type VersionListener = (this: IDBDatabase, ev: IDBVersionChangeEvent) => void;

interface StoreMeta {
  name: string;
  options: IDBObjectStoreParameters;
}

export const openDatabase = (
  name: string,
  version?: number,
): LocalStorageRequest<LocalStorageDb> => {
  const stores = JSON.parse(localStorage.getItem(`idb-stores-${name}`) || '[]');
  const currentVersion = Number(
    localStorage.getItem(`idb-version-${name}`) || '0',
  );
  const additional: Record<string, any> = {};
  let db = new LocalStorageDb(name, currentVersion, stores);
  if (version && currentVersion < version) {
    additional['upgradeneeded'] = {
      target: {
        result: db,
        transaction: db.transaction(''),
      },
      oldVersion: currentVersion,
      newVersion: version,
    };
    localStorage.setItem(`idb-version-${name}`, String(version));
    db = new LocalStorageDb(
      name,
      version,
      JSON.parse(localStorage.getItem(`idb-stores-${name}`) || '[]'),
    );
  }
  return new LocalStorageRequest(db, null, additional);
};

export class LocalStorageDb implements IDBDatabase {
  onabort: (this: IDBDatabase, ev: Event) => any;
  onclose: (this: IDBDatabase, ev: Event) => any;
  onerror: (this: IDBDatabase, ev: Event) => any;
  onversionchange: (this: IDBDatabase, ev: IDBVersionChangeEvent) => any;

  constructor(
    readonly name: string,
    readonly version: number,
    private stores: StoreMeta[],
  ) {}

  get objectStoreNames(): DOMStringList {
    return makeDomList(this.stores.map((m) => m.name));
  }

  addEventListener<K extends keyof IDBDatabaseEventMap>(
    type: K,
    listener: (this: IDBDatabase, ev: IDBDatabaseEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: unknown, listener: unknown, options?: unknown): void {}

  removeEventListener<K extends keyof IDBDatabaseEventMap>(
    type: K,
    listener: (this: IDBDatabase, ev: IDBDatabaseEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: unknown,
    listener: unknown,
    options?: unknown,
  ): void {}

  close(): void {}

  createObjectStore(
    name: string,
    options?: IDBObjectStoreParameters,
  ): IDBObjectStore {
    const meta = { name, options: options || {} };
    this.stores.push(meta);
    localStorage.setItem(`idb-stores-${name}`, JSON.stringify(this.stores));
    return new LocalStorageStore(this, meta);
  }

  getStore(name: string) {
    const meta = this.stores.find((m) => m.name === name);
    if (!meta) {
      return null;
    }
    return new LocalStorageStore(this, meta);
  }

  deleteObjectStore(name: string): void {
    const index = this.stores.findIndex((m) => m.name === name);
    if (index < 0) {
      return;
    }
    const meta = this.stores.splice(index, 1)[0];
    localStorage.setItem(`idb-stores-${name}`, JSON.stringify(this.stores));
    new LocalStorageStore(this, meta).deleteStore();
  }

  transaction(
    storeNames: string | string[],
    mode?: IDBTransactionMode,
    options?: any,
  ): IDBTransaction {
    if (typeof storeNames === 'string') {
      storeNames = [storeNames];
    }
    return new LocalStorageTransaction(
      this,
      makeDomList(storeNames),
      mode,
      options?.durability,
    );
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

export class LocalStorageTransaction implements IDBTransaction {
  readonly error: DOMException = null;
  readonly db: IDBDatabase;
  onerror: (this: IDBTransaction, ev: Event) => any;
  onabort: (this: IDBTransaction, ev: Event) => any;
  constructor(
    private readonly myDb: LocalStorageDb,
    readonly objectStoreNames: DOMStringList,
    readonly mode: IDBTransactionMode,
    readonly durability: IDBTransactionDurability,
  ) {
    this.db = myDb;
  }
  get oncomplete() {
    return null;
  }
  set oncomplete(listener: (this: IDBTransaction, ev: Event) => any) {
    listener.bind(this)(null);
  }

  abort(): void {}

  objectStore(name: string): IDBObjectStore {
    return this.myDb.getStore(name);
  }

  addEventListener<K extends keyof IDBTransactionEventMap>(
    type: K,
    listener: (this: IDBTransaction, ev: IDBTransactionEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: unknown, listener: unknown, options?: unknown): void {}

  removeEventListener<K extends keyof IDBTransactionEventMap>(
    type: K,
    listener: (this: IDBTransaction, ev: IDBTransactionEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: unknown,
    listener: unknown,
    options?: unknown,
  ): void {}

  commit(): void {}

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

interface IndexMeta {
  name: string;
  keyPath: string | string[];
  options: IDBIndexParameters;
}

const getKeyFromValue = (value: any, keypath: string | string[]) => {
  if (typeof keypath === 'string') {
    return keypath.split('.').reduce((acc, label) => acc[label], value);
  }
  return keypath.map((v) =>
    v.split('.').reduce((acc, label) => acc[label], value),
  );
};

const validKeyToComputed = (query: IDBValidKey) => {
  if (Array.isArray(query)) {
    return query.join('-!.!-');
  }
  return String(query);
};

const computeKey = (value: any, keypath: string | string[]) => {
  if (typeof keypath === 'string') {
    keypath = [keypath];
  }
  return keypath
    .map((v) => v.split('.').reduce((acc, label) => acc[label], value))
    .join('-!.!-');
};

export class LocalStorageStore implements IDBObjectStore {
  readonly autoIncrement: boolean;
  readonly keyPath: string | string[];
  readonly name: string;
  readonly transaction: IDBTransaction = null;
  data: { [key: string]: any };
  private indexes: IndexMeta[];
  private cachedIndexes: { [key: string]: string | string[] }[];

  constructor(readonly myDb: LocalStorageDb, readonly meta: StoreMeta) {
    this.autoIncrement = Boolean(meta.options?.autoIncrement);
    console.assert(!this.autoIncrement);
    this.keyPath = meta.options?.keyPath || null;
    console.assert(Boolean(this.keyPath));
    this.name = meta.name;
    this.indexes = JSON.parse(
      localStorage.getItem(`idb-store-indexes-${myDb.name}.!-${meta.name}`) ||
        '[]',
    );
    this.data = JSON.parse(
      localStorage.getItem(`idb-store-${this.myDb.name}.!-${this.meta.name}`) ||
        '{}',
    );
    this.cachedIndexes = this.indexes.map((index) => {
      const str =
        localStorage.getItem(
          `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
        ) || '{}';
      return JSON.parse(str);
    });
  }

  get indexNames(): DOMStringList {
    return makeDomList(this.indexes.map((m) => m.name));
  }

  add(value: any, key?: IDBValidKey): IDBRequest<IDBValidKey> {
    if (this.violates(value, false)) {
      return new LocalStorageRequest(null, new DOMException('ConstraintError'));
    }
    const cKey = computeKey(value, this.keyPath);
    this.data[cKey] = value;
    localStorage.setItem(
      `idb-store-${this.myDb.name}.!-${this.meta.name}`,
      JSON.stringify(this.data),
    );
    this.indexes.forEach((index, i) => {
      const iKey = computeKey(value, index.keyPath);
      if (index.options.unique) {
        this.cachedIndexes[i][iKey] = cKey;
      } else {
        let arr = this.cachedIndexes[i][iKey] as string[];
        if (!arr) {
          arr = [];
          this.cachedIndexes[i][iKey] = arr;
        }
        arr.push(cKey);
      }
      localStorage.setItem(
        `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
        JSON.stringify(this.cachedIndexes[i]),
      );
    });
    return new LocalStorageRequest(cKey, null);
  }

  put(value: any, key?: IDBValidKey): IDBRequest<IDBValidKey> {
    if (this.violates(value, true)) {
      return new LocalStorageRequest(null, new DOMException('ConstraintError'));
    }
    const cKey = computeKey(value, this.keyPath);
    this.data[cKey] = value;
    localStorage.setItem(
      `idb-store-${this.myDb.name}.!-${this.meta.name}`,
      JSON.stringify(this.data),
    );
    this.indexes.forEach((index, i) => {
      const iKey = computeKey(value, index.keyPath);
      if (index.options.unique) {
        this.cachedIndexes[i][iKey] = cKey;
      } else {
        let arr = this.cachedIndexes[i][iKey] as string[];
        if (!arr) {
          arr = [];
          this.cachedIndexes[i][iKey] = arr;
        }
        arr.push(cKey);
      }
      localStorage.setItem(
        `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
        JSON.stringify(this.cachedIndexes[i]),
      );
    });
    return new LocalStorageRequest(cKey, null);
  }

  clear(): IDBRequest<undefined> {
    this.data = {};
    localStorage.removeItem(`idb-store-${this.myDb.name}.!-${this.meta.name}`);
    this.indexes.forEach((index, i) => {
      this.cachedIndexes[i] = {};
      localStorage.removeItem(
        `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
      );
    });
    return new LocalStorageRequest(undefined, null);
  }

  count(query?: IDBValidKey | IDBKeyRange): IDBRequest<number> {
    if (!query) {
      return new LocalStorageRequest(Object.keys(this.data).length, null);
    }
    if (query instanceof IDBKeyRange) {
      let count = 0;
      for (const key of Object.keys(this.data)) {
        const elemKey = getKeyFromValue(this.data[key], this.keyPath);
        if (query.includes(elemKey)) {
          count++;
        }
      }
      return new LocalStorageRequest(count, null);
    }
    return new LocalStorageRequest(
      Number(validKeyToComputed(query) in this.data),
      null,
    );
  }

  createIndex(
    name: string,
    keyPath: string | string[],
    options?: IDBIndexParameters,
  ): IDBIndex {
    const meta = {
      name,
      keyPath,
      options: options || {},
    };
    const index = this.indexes.push(meta) - 1;
    localStorage.setItem(
      `idb-store-indexes-${this.myDb.name}.!-${this.meta.name}`,
      JSON.stringify(this.indexes),
    );
    this.cachedIndexes.push({});
    return new LocalStorageIndex(meta, this, this.cachedIndexes[index]);
  }

  delete(query: IDBValidKey | IDBKeyRange): IDBRequest<undefined> {
    if (query instanceof IDBKeyRange) {
      for (const key of Object.keys(this.data)) {
        const element = this.data[key];
        const elemKey = getKeyFromValue(element, this.keyPath);
        if (!query.includes(elemKey)) {
          continue;
        }
        delete this.data[key];
        this.indexes.forEach((index, i) => {
          const iKey = computeKey(element, index.keyPath);
          const data = this.cachedIndexes[i];
          if (index.options.unique) {
            if (data[iKey] === elemKey) {
              data[iKey] = null;
            }
          } else {
            const index = data[iKey].indexOf(elemKey);
            if (index < 0) {
              return;
            }
            (data[iKey] as string[]).splice(index, 1);
          }
        });
      }
      localStorage.setItem(
        `idb-store-${this.myDb.name}.!-${this.meta.name}`,
        JSON.stringify(this.data),
      );
      this.indexes.forEach((index, i) => {
        localStorage.setItem(
          `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
          JSON.stringify(this.cachedIndexes[i]),
        );
      });
      return new LocalStorageRequest(undefined, null);
    }
    const cKey = validKeyToComputed(query);
    const element = this.data[cKey];
    if (element) {
      delete this.data[cKey];
      localStorage.setItem(
        `idb-store-${this.myDb.name}.!-${this.meta.name}`,
        JSON.stringify(this.data),
      );
      this.indexes.forEach((index, i) => {
        const iKey = computeKey(element, index.keyPath);
        const data = this.cachedIndexes[i];
        if (index.options.unique) {
          if (data[iKey] === cKey) {
            data[iKey] = null;
          }
        } else {
          const index = data[iKey].indexOf(cKey);
          if (index < 0) {
            return;
          }
          (data[iKey] as string[]).splice(index, 1);
        }
        localStorage.setItem(
          `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
          JSON.stringify(data),
        );
      });
    }
    return new LocalStorageRequest(undefined, null);
  }

  deleteIndex(name: string): void {
    const i = this.indexes.findIndex((i) => i.name === name);
    if (i < 0) {
      return;
    }
    this.indexes.splice(i, 1);
    localStorage.setItem(
      `idb-store-indexes-${this.myDb.name}.!-${this.meta.name}`,
      JSON.stringify(this.indexes),
    );
    this.cachedIndexes.splice(i, 1);
    localStorage.removeItem(
      `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${name}`,
    );
  }

  get(query: IDBValidKey | IDBKeyRange): IDBRequest<any> {
    if (query instanceof IDBKeyRange) {
      for (const key of Object.keys(this.data)) {
        const elemKey = getKeyFromValue(this.data[key], this.keyPath);
        if (query.includes(elemKey)) {
          return new LocalStorageRequest(this.data[key], null);
        }
      }
      return new LocalStorageRequest(undefined, null);
    }
    return new LocalStorageRequest(this.data[validKeyToComputed(query)], null);
  }

  getAll(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest<any[]> {
    count = count ?? Infinity;
    if (!query) {
      return new LocalStorageRequest(
        Object.keys(this.data)
          .slice(0, count)
          .map((key) => this.data[key]),
        null,
      );
    }
    if (query instanceof IDBKeyRange) {
      const result = [];
      for (const key of Object.keys(this.data)) {
        const elemKey = getKeyFromValue(this.data[key], this.keyPath);
        if (query.includes(elemKey)) {
          result.push(this.data[key]);
          if (result.length >= count) {
            break;
          }
        }
      }
      return new LocalStorageRequest(result, null);
    }
    const cKey = validKeyToComputed(query);
    return new LocalStorageRequest(
      cKey in this.data ? [this.data[cKey]].slice(0, count) : [],
      null,
    );
  }

  getAllKeys(
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): IDBRequest<IDBValidKey[]> {
    count = count ?? Infinity;
    if (!query) {
      return new LocalStorageRequest(Object.keys(this.data), null);
    }
    if (query instanceof IDBKeyRange) {
      const result = [];
      for (const key of Object.keys(this.data)) {
        const elemKey = getKeyFromValue(this.data[key], this.keyPath);
        if (query.includes(elemKey)) {
          result.push(key);
          if (result.length >= count) {
            break;
          }
        }
      }
      return new LocalStorageRequest(result, null);
    }
    const cKey = validKeyToComputed(query);
    return new LocalStorageRequest(
      cKey in this.data ? [cKey].slice(0, count) : [],
      null,
    );
  }

  getKey(query: IDBValidKey | IDBKeyRange): IDBRequest<IDBValidKey> {
    if (query instanceof IDBKeyRange) {
      for (const key of Object.keys(this.data)) {
        const elemKey = getKeyFromValue(this.data[key], this.keyPath);
        if (query.includes(elemKey)) {
          return new LocalStorageRequest(key, null);
        }
      }
      return new LocalStorageRequest(undefined, null);
    }
    const cKey = validKeyToComputed(query);
    return new LocalStorageRequest(cKey in this.data ? cKey : undefined, null);
  }

  index(name: string): IDBIndex {
    const i = this.indexes.findIndex((i) => i.name === name);
    if (i < 0) {
      return null;
    }
    return new LocalStorageIndex(this.indexes[i], this, this.cachedIndexes[i]);
  }

  openCursor(
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursorWithValue> {
    console.assert(false, 'Cursors are not supported!');
    return undefined;
  }

  openKeyCursor(
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursor> {
    console.assert(false, 'Cursors are not supported!');
    return undefined;
  }

  deleteStore() {
    localStorage.removeItem(
      `idb-store-indexes-${this.myDb.name}.!-${this.meta.name}`,
    );
    for (const index of this.indexes) {
      localStorage.removeItem(
        `idb-store-index-${this.myDb.name}.!-${this.meta.name}-!.${index.name}`,
      );
    }
    localStorage.removeItem(`idb-store-${this.myDb.name}.!-${this.meta.name}`);
  }

  private violates(value: any, override: boolean): boolean {
    const cKey = computeKey(value, this.keyPath);
    const oldValue = this.data[cKey];
    const oldKey = oldValue && computeKey(oldValue, this.keyPath);
    if (oldKey && !override) {
      return true;
    }
    for (let i = 0; i < this.indexes.length; i++) {
      const index = this.indexes[i];
      if (!index.options.unique) {
        continue;
      }
      const iKey = computeKey(value, index.keyPath);
      const oldIKey = this.cachedIndexes[i][iKey];
      if (oldIKey && (oldIKey !== oldKey || !override)) {
        return true;
      }
    }
    return false;
  }
}

export class LocalStorageIndex implements IDBIndex {
  readonly multiEntry: boolean;
  readonly name: string;
  readonly keyPath: string | string[];
  readonly objectStore: IDBObjectStore = null;
  readonly unique: boolean;

  constructor(
    meta: IndexMeta,
    private parent: LocalStorageStore,
    private indexData: { [key: string]: string | string[] },
  ) {
    this.multiEntry = meta.options.multiEntry || false;
    console.assert(!this.multiEntry);
    this.unique = meta.options.multiEntry || false;
    console.assert(!this.unique);
    this.name = meta.name;
    this.keyPath = meta.keyPath;
  }

  count(query?: IDBValidKey | IDBKeyRange): IDBRequest<number> {
    if (!query) {
      return new LocalStorageRequest(
        Object.keys(this.parent.data).length,
        null,
      );
    }
    if (query instanceof IDBKeyRange) {
      let count = 0;
      for (const key of Object.keys(this.indexData)) {
        const data = this.indexData[key];
        if (data.length < 1) {
          continue;
        }
        const iKey = getKeyFromValue(this.parent.data[data[0]], this.keyPath);
        if (query.includes(iKey)) {
          count += data.length;
        }
      }
      return new LocalStorageRequest(count, null);
    }
    const iKey = validKeyToComputed(query);
    return new LocalStorageRequest(this.indexData[iKey]?.length || 0, null);
  }

  get(query: IDBValidKey | IDBKeyRange): IDBRequest<any> {
    if (query instanceof IDBKeyRange) {
      for (const key of Object.keys(this.indexData)) {
        const data = this.indexData[key];
        if (data.length < 1) {
          continue;
        }
        const element = this.parent.data[data[0]];
        const iKey = getKeyFromValue(element, this.keyPath);
        if (query.includes(iKey)) {
          return new LocalStorageRequest(element, null);
        }
      }
      return new LocalStorageRequest(undefined, null);
    }
    const data = this.indexData[validKeyToComputed(query)];
    if (!data?.length) {
      return new LocalStorageRequest(undefined, null);
    }
    return new LocalStorageRequest(this.parent.data[data[0]], null);
  }

  getKey(query: IDBValidKey | IDBKeyRange): IDBRequest<IDBValidKey> {
    if (query instanceof IDBKeyRange) {
      for (const key of Object.keys(this.indexData)) {
        const data = this.indexData[key];
        if (data.length < 1) {
          continue;
        }
        const element = this.parent.data[data[0]];
        const iKey = getKeyFromValue(element, this.keyPath);
        if (query.includes(iKey)) {
          return new LocalStorageRequest(
            getKeyFromValue(element, this.parent.keyPath),
            null,
          );
        }
      }
      return new LocalStorageRequest(undefined, null);
    }
    const data = this.indexData[validKeyToComputed(query)];
    if (!data?.length) {
      return new LocalStorageRequest(undefined, null);
    }
    const element = this.parent.data[data[0]];
    return new LocalStorageRequest(
      getKeyFromValue(element, this.parent.keyPath),
      null,
    );
  }

  getAll(query?: IDBValidKey | IDBKeyRange, count?: number): IDBRequest<any[]> {
    count = count ?? Infinity;
    if (!query) {
      return new LocalStorageRequest(
        Object.keys(this.parent.data)
          .slice(0, count)
          .map((key) => this.parent.data[key]),
        null,
      );
    }
    if (query instanceof IDBKeyRange) {
      const result = [];
      for (const key of Object.keys(this.indexData)) {
        const data = this.indexData[key];
        if (data.length < 1) {
          continue;
        }
        const element = this.parent.data[data[0]];
        const iKey = getKeyFromValue(element, this.keyPath);
        if (query.includes(iKey)) {
          const i = 0;
          while (result.length < count && i < data.length) {
            result.push(this.parent.data[data[i]]);
          }
          if (result.length >= count) {
            break;
          }
        }
      }
      return new LocalStorageRequest(result, null);
    }
    const cKey = validKeyToComputed(query);
    const data = this.indexData[cKey] as string[];
    if (!data?.length) {
      return new LocalStorageRequest([], null);
    }
    return new LocalStorageRequest(
      data.map((v) => this.parent.data[v]),
      null,
    );
  }

  getAllKeys(
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): IDBRequest<IDBValidKey[]> {
    count = count ?? Infinity;
    if (!query) {
      return new LocalStorageRequest(
        Object.keys(this.parent.data)
          .slice(0, count)
          .map((key) =>
            getKeyFromValue(this.parent.data[key], this.parent.keyPath),
          ),
        null,
      );
    }
    if (query instanceof IDBKeyRange) {
      const result = [];
      for (const key of Object.keys(this.indexData)) {
        const data = this.indexData[key];
        if (data.length < 1) {
          continue;
        }
        const element = this.parent.data[data[0]];
        const iKey = getKeyFromValue(element, this.keyPath);
        if (query.includes(iKey)) {
          const i = 0;
          while (result.length < count && i < data.length) {
            result.push(
              getKeyFromValue(this.parent.data[data[i]], this.parent.keyPath),
            );
          }
          if (result.length >= count) {
            break;
          }
        }
      }
      return new LocalStorageRequest(result, null);
    }
    const cKey = validKeyToComputed(query);
    const data = this.indexData[cKey] as string[];
    if (!data?.length) {
      return new LocalStorageRequest([], null);
    }
    return new LocalStorageRequest(
      data.map((v) =>
        getKeyFromValue(this.parent.data[v], this.parent.keyPath),
      ),
      null,
    );
  }

  openCursor(
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursorWithValue> {
    console.assert(false, 'Cursors are not supported!');
    return undefined;
  }

  openKeyCursor(
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection,
  ): IDBRequest<IDBCursor> {
    console.assert(false, 'Cursors are not supported!');
    return undefined;
  }
}

export class LocalStorageRequest<T> implements IDBRequest<T> {
  readonly readyState: IDBRequestReadyState = 'done';
  readonly source: IDBObjectStore | IDBIndex | IDBCursor = null;
  readonly transaction: IDBTransaction = null;

  constructor(
    readonly result: T,
    readonly error: DOMException,
    private additional?: { [eventName: string]: any },
  ) {}

  get onerror() {
    return null;
  }
  set onerror(listener: (this: IDBRequest<T>, ev: Event) => any) {
    if (this.error) {
      listener.bind(this)(null);
    }
  }
  // eslint-disable-next-line @typescript-eslint/member-ordering
  get onsuccess() {
    return null;
  }
  set onsuccess(listener: (this: IDBRequest<T>, ev: Event) => any) {
    if (!this.error) {
      listener.bind(this)(null);
    }
  }

  addEventListener<K extends keyof IDBRequestEventMap>(
    type: K,
    listener: (this: IDBRequest<T>, ev: IDBRequestEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: unknown, listener: unknown, options?: unknown): void {
    const obj = this.additional || {};
    if ((type as string) in obj) {
      (listener as () => unknown).bind(this)(obj[type as string]);
    }
  }

  removeEventListener<K extends keyof IDBRequestEventMap>(
    type: K,
    listener: (this: IDBRequest<T>, ev: IDBRequestEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: unknown,
    listener: unknown,
    options?: unknown,
  ): void {}

  dispatchEvent(event: Event): boolean {
    return true;
  }
}
