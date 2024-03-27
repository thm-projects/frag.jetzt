export const preMigrationStep = (
  db: IDBDatabase,
  transaction: IDBTransaction,
  version: number,
) => {
  if (version === 3) migrateToNewDb(db, transaction);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const migrateToNewDb = (db: IDBDatabase, transaction: IDBTransaction) => {
  for (const key of Array.from(db.objectStoreNames)) {
    db.deleteObjectStore(key);
  }
  localStorage.clear();
};
