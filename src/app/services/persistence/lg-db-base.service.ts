import { inject } from '@angular/core';
import { LgPersistService } from './lg-persist.service';
import {
  fromRequest,
  fromRequestClosing,
  fromWriteRequestClosing,
} from './lg-persist.schema.types';
import { Observable, forkJoin, map, switchMap, throwError } from 'rxjs';
import { SCHEMA } from './lg-persist.schema';

class BatchedCursor<Name extends keyof (typeof SCHEMA)['stores'], Type> {
  private nextAvailable = true;
  private previousFinished = true;

  constructor(
    private lgPersist: LgPersistService,
    private storeName: Name,
    private lowerBound,
    private lowerOpen: boolean,
    private upperBound,
    private upperOpen: boolean,
    private keyPath: string | Readonly<string[]> | null,
    private batchSize: number = 1000,
    private indexName: keyof (typeof SCHEMA)['stores'][Name]['indexes'] = null,
  ) {}

  hasNext() {
    return this.nextAvailable;
  }

  next() {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        if (!this.nextAvailable) {
          return throwError(() => 'No more elements');
        }
        if (!this.previousFinished) {
          return throwError(
            () => 'Previous iteration not finished or had an error',
          );
        }
        this.previousFinished = false;
        const trans = con.transaction(this.storeName, 'readonly');
        const keyRange = IDBKeyRange.bound(
          this.lowerBound,
          this.upperBound,
          this.lowerOpen,
          this.upperOpen,
        );
        const store = this.indexName
          ? trans.objectStore(this.storeName)
          : trans.objectStore(this.storeName).index(this.indexName);
        const arr = this.keyPath
          ? [
              fromRequestClosing(
                trans,
                store.getAll(keyRange, this.batchSize),
              ) as Observable<Type[]>,
            ]
          : [
              fromRequest(store.getAll(keyRange, this.batchSize)) as Observable<
                Type[]
              >,
              fromRequestClosing(
                trans,
                store.getAllKeys(keyRange, this.batchSize),
              ) as Observable<IDBValidKey[]>,
            ];
        return forkJoin(arr).pipe(
          map((keyValues) => {
            const values = keyValues[0] as Type[];
            const keys = (keyValues[1] || []) as IDBValidKey[];
            const data = values.map((x, i) => ({
              inlineKey: keys[i] || null,
              value: x,
            }));
            this.previousFinished = true;
            if (data.length < this.batchSize) {
              this.nextAvailable = false;
              return data;
            }
            this.buildLowerBound(data[data.length - 1]);
            return data;
          }),
        );
      }),
    );
  }

  private buildLowerBound(lastElement: {
    inlineKey: IDBValidKey;
    value: Type;
  }) {
    this.lowerOpen = true;
    if (!this.keyPath) {
      this.lowerBound = lastElement.inlineKey;
      return;
    }
    const access = (key: string) =>
      key.split('.').reduce((acc, e) => acc[e], lastElement.value);
    if (!Array.isArray(this.keyPath)) {
      this.lowerBound = access(this.keyPath as string);
      return;
    }
    this.lowerBound = this.keyPath.map((key) => access(key));
  }
}

export class LgDbBaseService<Name extends keyof (typeof SCHEMA)['stores']> {
  protected lgPersist = inject(LgPersistService);

  constructor(
    private storeName: Name,
    private durability: IDBTransactionDurability = 'relaxed',
  ) {}

  clear(): Observable<undefined> {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans.objectStore(this.storeName).clear(),
        );
      }),
    );
  }

  createOrThrow(
    value: InstanceType<(typeof SCHEMA)['stores'][Name]['type']>,
    key?: IDBValidKey,
  ): Observable<IDBValidKey> {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans.objectStore(this.storeName).add(value, key),
        );
      }),
    );
  }

  createOrUpdate(
    value: InstanceType<(typeof SCHEMA)['stores'][Name]['type']>,
    key?: IDBValidKey,
  ): Observable<IDBValidKey> {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans.objectStore(this.storeName).put(value, key),
        );
      }),
    );
  }

  delete(query: IDBValidKey | IDBKeyRange): Observable<undefined> {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans.objectStore(this.storeName).delete(query),
        );
      }),
    );
  }

  count(query?: IDBValidKey | IDBKeyRange): Observable<number> {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).count(query),
        );
      }),
    );
  }

  getAll(query?: IDBValidKey | IDBKeyRange, count?: number) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).getAll(query, count),
        );
      }),
    );
  }

  getAllKeys(query?: IDBValidKey | IDBKeyRange, count?: number) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).getAllKeys(query, count),
        );
      }),
    );
  }

  get(query: IDBValidKey | IDBKeyRange) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).get(query),
        );
      }),
    );
  }

  getKey(query: IDBValidKey | IDBKeyRange) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).getKey(query),
        );
      }),
    );
  }

  getBatchedCursor(
    rangeBound: IDBKeyRange,
    batchCount?: number,
  ): BatchedCursor<
    Name,
    InstanceType<(typeof SCHEMA)['stores'][Name]['type']>
  > {
    return new BatchedCursor(
      this.lgPersist,
      this.storeName,
      rangeBound.lower,
      rangeBound.lowerOpen,
      rangeBound.upper,
      rangeBound.upperOpen,
      SCHEMA.stores[this.storeName].options?.keyPath,
      batchCount,
    );
  }

  countByIndex(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    query?: IDBValidKey | IDBKeyRange,
  ) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).index(index).count(query),
        );
      }),
    );
  }

  getAllByIndex(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).index(index).getAll(query, count),
        );
      }),
    );
  }

  getAllKeysByIndex(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans
            .objectStore(this.storeName)
            .index(index)
            .getAllKeys(query, count),
        );
      }),
    );
  }

  getByIndex(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    query: IDBValidKey | IDBKeyRange,
  ) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).index(index).get(query),
        );
      }),
    );
  }

  getKeyByIndex(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    query: IDBValidKey | IDBKeyRange,
  ) {
    return this.lgPersist.database$.pipe(
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).index(index).getKey(query),
        );
      }),
    );
  }

  getBatchedIndexCursor(
    index: keyof (typeof SCHEMA)['stores'][Name]['indexes'],
    rangeBound: IDBKeyRange,
    batchCount?: number,
  ): BatchedCursor<
    Name,
    InstanceType<(typeof SCHEMA)['stores'][Name]['type']>
  > {
    return new BatchedCursor(
      this.lgPersist,
      this.storeName,
      rangeBound.lower,
      rangeBound.lowerOpen,
      rangeBound.upper,
      rangeBound.upperOpen,
      SCHEMA.stores[this.storeName].options?.keyPath,
      batchCount,
      index,
    );
  }
}
