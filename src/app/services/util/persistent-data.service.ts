import { Injectable, Injector } from '@angular/core';
import { DB_CONFIG } from 'indexeddb';
import { NgxIndexedDBService, ObjectStoreMeta } from 'ngx-indexed-db';
import { ReplaySubject } from 'rxjs';

interface DataAccess {
  bulkGet: any;
}

const dataTypeMeta: { [key: string]: ObjectStoreMeta } = {};

DB_CONFIG.objectStoresMeta.forEach((meta) => {
  dataTypeMeta[meta.store] = meta;
});

class LocalDataAccess {
  bulkGet: 1;
}

@Injectable({
  providedIn: 'root',
})
export class PersistentDataService {
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
}
