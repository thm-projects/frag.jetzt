import { FieldsOf } from 'app/utils/ts-utils';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

type Access<T> = T[keyof T];

type ExtractValidKeys<T, Prefix extends string = ''> = Access<{
  [K in keyof T]: K extends string
    ? T[K] extends IDBValidKey
      ? `${Prefix}${K}`
      : T[K] extends object
        ? ExtractValidKeys<T[K], `${Prefix}${K}.`>
        : never
    : never;
}>;

type ArrayOrSingle<T> = T | Readonly<T[]>;
export type ValidKey<T extends object> = ArrayOrSingle<ExtractValidKeys<T>>;

export interface DbStoreIndex {
  since: number;
  keyPath: string | Readonly<string[]>;
  options?: IDBIndexParameters;
}

export interface DbStoreOptions {
  /**
   * Defaults to false
   */
  autoIncrement?: boolean;
  /**
   * Defaults to null (key is stored external)
   */
  keyPath?: string | Readonly<string[]> | null;
}

export interface DbStore<T extends object> {
  since: number;
  type: new (obj: FieldsOf<T>) => T;
  indexes: Record<string, DbStoreIndex>;
  options: DbStoreOptions;
}

type Migrator = (
  schema: DatabaseSchema,
  db: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
  newVersion: number,
) => void;

export interface DatabaseSchema {
  name: string;
  version: number;
  migrator: Migrator;
  stores: Record<string, DbStore<object>>;
}

enum LogLevel {
  Trace = 'Trace',
  Info = 'Info',
  Warn = 'Warn',
}

const DEFAULT_LEVEL =
  environment.db_migration === LogLevel.Trace
    ? LogLevel.Trace
    : environment.db_migration === LogLevel.Info
      ? LogLevel.Info
      : LogLevel.Warn;

class Logger {
  version: string = '0';
  logLevel: number = 0;
  readonly logLevelToNumber = {
    [LogLevel.Trace]: 0,
    [LogLevel.Info]: 1,
    [LogLevel.Warn]: 2,
  };

  constructor(
    private schema: DatabaseSchema,
    logLevel: LogLevel,
  ) {
    this.logLevel = this.logLevelToNumber[logLevel];
  }

  log(ll: LogLevel, message: string) {
    const level = this.logLevelToNumber[ll];
    if (level < this.logLevel) {
      return;
    }
    const log = level < 2 ? console.info : console.warn;
    log(
      `[IDB Migrate] ${this.schema.name} - Mig. ${this.version} - ${message}`,
    );
  }
}

type StepMigrator = (
  db: IDBDatabase,
  transaction: IDBTransaction,
  version: number,
) => void;

interface Props {
  preMigrateStep?: StepMigrator;
  customMigrationStep?: StepMigrator;
  logLevel?: LogLevel;
}

export const buildDefaultMigrator = ({
  preMigrateStep = null,
  customMigrationStep = null,
  logLevel = DEFAULT_LEVEL,
}: Props = {}): Migrator => {
  return (
    schema: DatabaseSchema,
    db: IDBDatabase,
    transaction: IDBTransaction,
    oldVersion: number,
    newVersion: number,
  ) => {
    const logger = new Logger(schema, logLevel);
    for (let version = oldVersion + 1; version <= newVersion; version++) {
      logger.version = String(version);
      preMigrateStep?.(db, transaction, version);
      syncStores(db, transaction, schema, version, logger);
      customMigrationStep?.(db, transaction, version);
    }
    logger.version = 'post-migrations';
    const toDelete = new Set(Array.from(db.objectStoreNames));
    for (const storeName of Object.keys(schema.stores)) {
      if (!toDelete.delete(storeName)) {
        logger.log(LogLevel.Info, `Store ${storeName} not yet created.`);
        continue;
      }
      const store = schema.stores[storeName];
      const dbStore = transaction.objectStore(storeName);
      const toDeleteIndexes = new Set(Array.from(dbStore.indexNames));
      for (const indexName of Object.keys(store.indexes || {})) {
        if (!toDeleteIndexes.delete(indexName)) {
          logger.log(
            LogLevel.Info,
            `Store ${storeName}: Index ${indexName} not yet created.`,
          );
        }
      }
      for (const indexName of toDeleteIndexes) {
        logger.log(
          LogLevel.Info,
          `Store ${storeName}: Index ${indexName} is not covered by the schema. Should be deleted or added to schema.`,
        );
      }
    }
    for (const storeName of toDelete) {
      logger.log(
        LogLevel.Info,
        `Store ${storeName} is not covered by the schema. Should be deleted or added to schema.`,
      );
    }
  };
};

const syncStores = (
  db: IDBDatabase,
  transaction: IDBTransaction,
  schema: DatabaseSchema,
  version: number,
  logger: Logger,
) => {
  for (const storeName of Object.keys(schema.stores)) {
    const store = schema.stores[storeName];
    // Store will be created in future
    if (store.since > version) {
      continue;
    }
    const exists = db.objectStoreNames.contains(storeName);
    // Store was already created
    if (store.since < version) {
      if (exists) {
        const objStore = transaction.objectStore(storeName);
        const sameProps = haveStoresSameProps(store, objStore);
        if (sameProps) {
          syncIndexes(storeName, version, store, objStore, logger);
          continue;
        }
        throw new Error(
          `${storeName} has other properties, deletion and recreation is up to you. Please make own pre migration.`,
        );
      } else {
        logger.log(
          LogLevel.Warn,
          `${storeName} should be present since ${store.since}, but it is not. Creating it...`,
        );
      }
      // if it exists, but it should be created now, throw error
    } else if (exists) {
      throw new Error(
        `${storeName} is present from older versions, please make own pre migration.`,
      );
    }
    logger.log(LogLevel.Trace, `Creating ${storeName}`);
    syncIndexes(
      storeName,
      version,
      store,
      db.createObjectStore(
        storeName,
        store.options as unknown as IDBObjectStoreParameters,
      ),
      logger,
    );
  }
};

const haveStoresSameProps = <T extends object>(
  store: DbStore<T>,
  objStore: IDBObjectStore,
) => {
  const autoIncrement = Boolean(store.options?.autoIncrement); // Default = false
  if (objStore.autoIncrement !== autoIncrement) return false;
  const keyPath = (store.options?.keyPath || null) as string | string[] | null; // Default = null
  return (
    objStore.keyPath === keyPath ||
    (Array.isArray(keyPath) &&
      Array.isArray(objStore.keyPath) &&
      keyPath.length === objStore.keyPath.length &&
      objStore.keyPath.every((e) => keyPath.includes(e)))
  );
};

const syncIndexes = (
  storeName: string,
  version: number,
  store: DbStore<object>,
  objStore: IDBObjectStore,
  logger: Logger,
) => {
  for (const indexName of Object.keys(store.indexes || {})) {
    const index = store.indexes[indexName];
    // Index will be created in future
    if (index.since > version) {
      continue;
    }
    const exists = objStore.indexNames.contains(indexName);
    // Index was already created
    if (index.since < version) {
      const indexDb = objStore.index(indexName);
      const sameProps = haveIndexesSameProps(index, indexDb);
      if (exists && sameProps) {
        continue;
      } else if (exists) {
        throw new Error(
          `${storeName}: Index ${indexName} has other properties, deletion and recreation is up to you. Please make own pre migration.`,
        );
      } else {
        logger.log(
          LogLevel.Warn,
          `${storeName}: Index ${indexName} should be present since ${index.since}, but it is not. Creating it...`,
        );
      }
      // if it exists, but it should be created now, throw error
    } else if (exists) {
      throw new Error(
        `${storeName}: Index ${indexName} is present from older versions, please make own pre migration.`,
      );
    }
    logger.log(LogLevel.Trace, `${storeName}: Creating Index ${indexName}`);
    objStore.createIndex(
      indexName,
      index.keyPath as string | string[],
      index.options,
    );
  }
};

const haveIndexesSameProps = (
  index: DbStoreIndex,
  indexDB: IDBIndex,
): boolean => {
  const multiEntry = Boolean(index.options?.multiEntry); // Default = false
  if (indexDB.multiEntry !== multiEntry) return false;
  const unique = Boolean(index.options?.unique); // Default = false
  if (indexDB.unique !== unique) return false;
  const keyPath = index.keyPath as string | string[];
  return (
    indexDB.keyPath === keyPath ||
    (Array.isArray(keyPath) &&
      Array.isArray(indexDB.keyPath) &&
      keyPath.length === indexDB.keyPath.length &&
      indexDB.keyPath.every((e) => keyPath.includes(e)))
  );
};

type Walk<Path extends string, Obj> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Obj extends Record<string, any>
    ? Path extends `${infer Pre}.${infer Last}`
      ? Walk<Last, Obj[Pre]>
      : Obj[Path]
    : never;

type TransformArray<
  Path,
  Obj,
  Start extends unknown[] = [],
> = Path extends readonly [infer A extends string, ...infer Rest]
  ? TransformArray<Rest, Obj, [Walk<A, Obj>, ...Start]>
  : Start;

export type Transform<Path, Obj> = Path extends string
  ? Walk<Path, Obj>
  : Path extends readonly string[]
    ? TransformArray<Path, Obj, []>
    : unknown;

export interface LgCursor<T> extends IDBCursor {
  update(value: T): IDBRequest<IDBValidKey>;
}

export interface LgCursorWithValue<T> extends LgCursor<T> {
  readonly value: T;
}

export interface LgIndex<T> extends IDBIndex {
  get(query: IDBValidKey | IDBKeyRange): IDBRequest<T>;
  getAll(
    query?: IDBValidKey | IDBKeyRange | null,
    count?: number,
  ): IDBRequest<T[]>;
  openCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<LgCursorWithValue<T> | null>;
  openKeyCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<LgCursor<T> | null>;
}

export interface LgObjectStore<T, O extends DatabaseSchema['stores'][string]>
  extends IDBObjectStore {
  add(value: T, key?: IDBValidKey): IDBRequest<IDBValidKey>;
  get(query: IDBValidKey | IDBKeyRange): IDBRequest<T>;
  getAll(
    query?: IDBValidKey | IDBKeyRange | null,
    count?: number,
  ): IDBRequest<T[]>;
  openCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<LgCursorWithValue<T> | null>;
  openKeyCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
  ): IDBRequest<LgCursor<T> | null>;
  index<K extends keyof O['indexes']>(name: K): LgIndex<T>;
}

export type LgTransactionMode = Exclude<IDBTransactionMode, 'versionchange'>;
export interface LgTransaction<T extends DatabaseSchema>
  extends IDBTransaction {
  objectStore<K extends keyof T['stores']>(
    name: K,
  ): LgObjectStore<InstanceType<T['stores'][K]['type']>, T['stores'][K]>;
}

export interface TransactionOptions {
  durability: 'relaxed' | 'strict' | 'default';
}

export interface LgDb<T extends DatabaseSchema> extends IDBDatabase {
  transaction(
    storeNames: keyof T['stores'] | (keyof T['stores'])[],
    mode?: LgTransactionMode,
    options?: TransactionOptions,
  ): LgTransaction<T>;
}

export const fromWriteRequestClosing = <K>(
  trans: LgTransaction<DatabaseSchema>,
  request: IDBRequest<K>,
): Observable<K> => {
  trans.commit?.();
  return new Observable((sub) => {
    trans.addEventListener('complete', () => {
      if (!sub.closed) {
        sub.next(request.result);
        sub.complete();
      }
    });
    request.onerror = () => {
      if (!sub.closed) {
        sub.error(request.error);
      }
    };
    trans.addEventListener('error', () => {
      if (!sub.closed) {
        sub.error(trans.error);
      }
    });
  });
};

export const fromRequestClosing = <K>(
  trans: LgTransaction<DatabaseSchema>,
  request: IDBRequest<K>,
): Observable<K> => {
  trans.commit?.();
  return new Observable((sub) => {
    request.onsuccess = () => {
      sub.next(request.result);
      sub.complete();
    };
    request.onerror = () => sub.error(request.error);
  });
};

export const fromRequest = <K>(request: IDBRequest<K>): Observable<K> => {
  return new Observable((sub) => {
    request.onsuccess = () => {
      sub.next(request.result);
      sub.complete();
    };
    request.onerror = () => sub.error(request.error);
  });
};
