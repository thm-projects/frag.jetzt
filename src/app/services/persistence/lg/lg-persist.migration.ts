export const preMigrationStep = (
  db: IDBDatabase,
  transaction: IDBTransaction,
  version: number,
) => {
  if (version === 3) migrateToNewDb(db, transaction);
};

const tryDeleteStore = (db: IDBDatabase, store: string) => {
  if (db.objectStoreNames.contains(store)) {
    db.deleteObjectStore(store);
  }
};

const migrateToNewDb = (db: IDBDatabase, transaction: IDBTransaction) => {
  for (const key of Array.from(db.objectStoreNames)) {
    db.deleteObjectStore(key);
  }
  localStorage.clear();
};
