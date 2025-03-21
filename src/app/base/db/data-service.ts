import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subscriber,
  share,
} from 'rxjs';
import { LgDb } from './data.types';
import { SCHEMA } from './data.defintion';
import { LgDbBaseService } from './data.base';

export class DataService {
  readonly database$ = this.openDatabase().pipe(
    share({
      connector: () => new ReplaySubject(1),
      resetOnComplete: true,
      resetOnError: true,
      resetOnRefCountZero: false,
    }),
  );
  readonly comment = new LgDbBaseService('comment', this);
  readonly config = new LgDbBaseService('config', this);
  readonly localRoomSetting = new LgDbBaseService('local-room-setting', this);
  readonly moderator = new LgDbBaseService('moderator', this);
  readonly motd = new LgDbBaseService('motd', this);
  readonly readMotd = new LgDbBaseService('read-motd', this);
  readonly roomAccess = new LgDbBaseService('room-access', this);
  readonly room = new LgDbBaseService('room', this);
  private readonly newVersion$ = new ReplaySubject<number>(1);
  private readonly isBlocked$ = new BehaviorSubject<boolean>(false);

  isBlocked(): Observable<boolean> {
    return this.isBlocked$;
  }

  newVersion(): Observable<number> {
    return this.newVersion$;
  }

  private unblock() {
    if (this.isBlocked$.value) {
      this.isBlocked$.next(false);
    }
  }

  private block() {
    if (!this.isBlocked$.value) {
      this.isBlocked$.next(true);
    }
  }

  private prepareDatabase(
    db: IDBDatabase,
    subscriber: Subscriber<IDBDatabase>,
  ) {
    db.addEventListener('abort', (e) => {
      console.error('A transaction was aborted', e);
    });
    db.addEventListener('error', (e) => {
      console.error('A transaction had an error', e);
    });
    db.addEventListener('close', (e) => {
      console.error('Database closed unexpectedly', e);
      subscriber.complete();
    });
    db.addEventListener('versionchange', (e) => {
      console.info('A new version published at an other tab');
      // closes automatically the database
      subscriber.complete();
      this.newVersion$.next(e.newVersion);
    });
  }

  private openDatabase(): Observable<LgDb<typeof SCHEMA>> {
    return new Observable((subscriber) => {
      const request = indexedDB.open(SCHEMA.name, SCHEMA.version);
      let isClosed = false;
      let database: LgDb<typeof SCHEMA> = null;
      request.addEventListener('blocked', () => {
        this.block();
      });
      request.addEventListener('upgradeneeded', (e: IDBVersionChangeEvent) => {
        this.unblock();
        const req = e.target as IDBOpenDBRequest;
        try {
          SCHEMA.migrator(
            SCHEMA,
            req.result,
            req.transaction,
            e.oldVersion,
            e.newVersion,
          );
        } catch (e) {
          console.error(e);
          subscriber.error(e);
          req.transaction.abort();
          indexedDB.deleteDatabase(SCHEMA.name);
        }
      });
      request.addEventListener('success', () => {
        this.unblock();
        database = request.result as LgDb<typeof SCHEMA>;
        if (isClosed) {
          database.close();
          return;
        }
        this.prepareDatabase(database, subscriber);
        subscriber.next(database);
      });
      request.addEventListener('error', () => {
        this.unblock();
        subscriber.error(request.error);
      });
      return () => {
        isClosed = true;
        if (database != null) {
          database.close();
        }
      };
    });
  }
}

export const dataService = new DataService();
