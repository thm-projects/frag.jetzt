import { FieldsOf } from 'app/utils/ts-utils';
import { SCHEMA } from './data.defintion';
import { DataService } from './data-service';
import {
  Observable,
  forkJoin,
  map,
  merge,
  of,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import {
  Transform,
  fromRequest,
  fromRequestClosing,
  fromWriteRequestClosing,
} from './data.types';

class BatchedCursor<
  Name extends keyof (typeof SCHEMA)['stores'],
  IndexKeys extends keyof (typeof SCHEMA)['stores'][Name]['indexes'],
  Type,
> {
  private nextAvailable = true;
  private previousFinished = true;

  constructor(
    private lgPersist: DataService,
    private storeName: Name,
    private lowerBound,
    private lowerOpen: boolean,
    private upperBound,
    private upperOpen: boolean,
    private keyPath: string | Readonly<string[]> | null,
    private copyFunc: (type: Type) => Type,
    private batchSize: number = 1000,
    private indexName: IndexKeys = null,
    private durability: IDBTransactionDurability = 'relaxed',
    private copyOnFetch: boolean = false,
  ) {}

  hasNext() {
    return this.nextAvailable;
  }

  next() {
    return this.lgPersist.database$.pipe(
      take(1),
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
        const trans = con.transaction(this.storeName, 'readonly', {
          durability: this.durability,
        });
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
            let data;
            if (this.copyOnFetch) {
              data = values.map((x, i) => ({
                inlineKey: keys[i] || null,
                value: this.copyFunc(x),
              }));
            } else {
              data = values.map((x, i) => ({
                inlineKey: keys[i] || null,
                value: x,
              }));
            }
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

export class LgDbBaseService<
  Name extends keyof (typeof SCHEMA)['stores'],
  Type extends InstanceType<
    (typeof SCHEMA)['stores'][Name]['type']
  > = InstanceType<(typeof SCHEMA)['stores'][Name]['type']>,
  Keys extends Transform<
    (typeof SCHEMA)['stores'][Name]['options']['keyPath'],
    Type
  > = Transform<(typeof SCHEMA)['stores'][Name]['options']['keyPath'], Type>,
  IndexKeys extends
    keyof (typeof SCHEMA)['stores'][Name]['indexes'] = keyof (typeof SCHEMA)['stores'][Name]['indexes'],
> {
  protected typeClass: new (obj: FieldsOf<Type>) => Type;

  constructor(
    private storeName: Name,
    private lgPersist: DataService,
    private durability: IDBTransactionDurability = 'relaxed',
    private copyOnFetch: boolean = false,
  ) {
    this.typeClass = SCHEMA['stores'][storeName]['type'] as unknown as new (
      obj: FieldsOf<Type>,
    ) => Type;
  }

  clear(): Observable<undefined> {
    return this.lgPersist.database$.pipe(
      take(1),
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

  createOrThrow(value: Type, key?: Keys): Observable<Keys> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans
            .objectStore(this.storeName)
            .add(this.copy(value), key as IDBValidKey),
        ) as Observable<Keys>;
      }),
    );
  }

  createOrUpdate(value: Type, key?: Keys): Observable<Keys> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans
            .objectStore(this.storeName)
            .put(this.copy(value), key as IDBValidKey),
        ) as Observable<Keys>;
      }),
    );
  }

  createOrThrowMany(values: { value: Type; key?: Keys }[]): Observable<Keys> {
    if (values.length < 1) {
      return of();
    }
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        const store = trans.objectStore(this.storeName);
        const observables: Observable<Keys>[] = [];
        for (let i = 0; i < values.length - 1; i++) {
          const elem = values[i];
          observables.push(
            fromRequest(
              store.add(this.copy(elem.value), elem.key as IDBValidKey),
            ) as Observable<Keys>,
          );
        }
        const elem = values[values.length - 1];
        observables.push(
          fromWriteRequestClosing(
            trans,
            store.add(this.copy(elem.value), elem.key as IDBValidKey),
          ) as Observable<Keys>,
        );
        return merge(...observables);
      }),
    );
  }

  createOrUpdateMany(values: { value: Type; key?: Keys }[]): Observable<Keys> {
    if (values.length < 1) {
      return of();
    }
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        const store = trans.objectStore(this.storeName);
        const observables: Observable<Keys>[] = [];
        for (let i = 0; i < values.length - 1; i++) {
          const elem = values[i];
          observables.push(
            fromRequest(
              store.put(this.copy(elem.value), elem.key as IDBValidKey),
            ) as Observable<Keys>,
          );
        }
        const elem = values[values.length - 1];
        observables.push(
          fromWriteRequestClosing(
            trans,
            store.put(this.copy(elem.value), elem.key as IDBValidKey),
          ) as Observable<Keys>,
        );
        return merge(...observables);
      }),
    );
  }

  delete(query: Keys | IDBKeyRange): Observable<undefined> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        return fromWriteRequestClosing(
          trans,
          trans.objectStore(this.storeName).delete(query as IDBValidKey),
        );
      }),
    );
  }

  deleteMany(querys: (Keys | IDBKeyRange)[]): Observable<undefined> {
    if (querys.length < 1) {
      return of();
    }
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readwrite', {
          durability: this.durability,
        });
        const store = trans.objectStore(this.storeName);
        const observables: Observable<undefined>[] = [];
        for (let i = 0; i < querys.length - 1; i++) {
          observables.push(fromRequest(store.delete(querys[i] as IDBValidKey)));
        }
        const elem = querys[querys.length - 1];
        observables.push(
          fromWriteRequestClosing(trans, store.delete(elem as IDBValidKey)),
        );
        return merge(...observables);
      }),
    );
  }

  count(query?: Keys | IDBKeyRange): Observable<number> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).count(query as IDBValidKey),
        );
      }),
    );
  }

  getAll(query?: Keys | IDBKeyRange, count?: number): Observable<Type[]> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return (
          fromRequestClosing(
            trans,
            trans
              .objectStore(this.storeName)
              .getAll(query as IDBValidKey, count),
          ) as Observable<Type[]>
        ).pipe(
          map((data) =>
            this.copyOnFetch ? data.map((v) => this.copy(v)) : data,
          ),
        );
      }),
    );
  }

  getAllKeys(query?: Keys | IDBKeyRange, count?: number): Observable<Keys[]> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans
            .objectStore(this.storeName)
            .getAllKeys(query as IDBValidKey, count),
        ) as Observable<Keys[]>;
      }),
    );
  }

  get(query: Keys | IDBKeyRange): Observable<Type> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return (
          fromRequestClosing(
            trans,
            trans.objectStore(this.storeName).get(query as IDBValidKey),
          ) as Observable<Type>
        ).pipe(map((data) => (this.copyOnFetch ? this.copy(data) : data)));
      }),
    );
  }

  getKey(query: Keys | IDBKeyRange): Observable<Keys> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).getKey(query as IDBValidKey),
        ) as Observable<Keys>;
      }),
    );
  }

  getBatchedCursor(
    rangeBound: IDBKeyRange,
    batchCount?: number,
  ): BatchedCursor<Name, IndexKeys, Type> {
    return new BatchedCursor(
      this.lgPersist,
      this.storeName,
      rangeBound.lower,
      rangeBound.lowerOpen,
      rangeBound.upper,
      rangeBound.upperOpen,
      SCHEMA.stores[this.storeName].options?.keyPath,
      this.copy.bind(this),
      batchCount,
      null,
      this.durability,
      this.copyOnFetch,
    );
  }

  countByIndex(
    index: IndexKeys,
    query?: IDBValidKey | IDBKeyRange,
  ): Observable<number> {
    return this.lgPersist.database$.pipe(
      take(1),
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
    index: IndexKeys,
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): Observable<Type[]> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return (
          fromRequestClosing(
            trans,
            trans.objectStore(this.storeName).index(index).getAll(query, count),
          ) as Observable<Type[]>
        ).pipe(
          map((data) =>
            this.copyOnFetch ? data.map((v) => this.copy(v)) : data,
          ),
        );
      }),
    );
  }

  getAllKeysByIndex(
    index: IndexKeys,
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): Observable<IDBValidKey[]> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans
            .objectStore(this.storeName)
            .index(index)
            .getAllKeys(query, count),
        ) as Observable<IDBValidKey[]>;
      }),
    );
  }

  getByIndex(
    index: IndexKeys,
    query: IDBValidKey | IDBKeyRange,
  ): Observable<Type> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return (
          fromRequestClosing(
            trans,
            trans.objectStore(this.storeName).index(index).get(query),
          ) as Observable<Type>
        ).pipe(map((data) => (this.copyOnFetch ? this.copy(data) : data)));
      }),
    );
  }

  getKeyByIndex(
    index: IndexKeys,
    query: IDBValidKey | IDBKeyRange,
  ): Observable<IDBValidKey> {
    return this.lgPersist.database$.pipe(
      take(1),
      switchMap((con) => {
        const trans = con.transaction(this.storeName, 'readonly');
        return fromRequestClosing(
          trans,
          trans.objectStore(this.storeName).index(index).getKey(query),
        ) as Observable<IDBValidKey>;
      }),
    );
  }

  getBatchedIndexCursor(
    index: IndexKeys,
    rangeBound: IDBKeyRange,
    batchCount?: number,
  ): BatchedCursor<Name, IndexKeys, Type> {
    return new BatchedCursor(
      this.lgPersist,
      this.storeName,
      rangeBound.lower,
      rangeBound.lowerOpen,
      rangeBound.upper,
      rangeBound.upperOpen,
      SCHEMA.stores[this.storeName].options?.keyPath,
      this.copy.bind(this),
      batchCount,
      index,
      this.durability,
      this.copyOnFetch,
    );
  }

  protected copy(value: Type): Type {
    return new this.typeClass(value as FieldsOf<Type>);
  }
}
