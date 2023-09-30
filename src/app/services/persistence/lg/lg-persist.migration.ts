export const preMigrationStep = (
  db: IDBDatabase,
  transaction: IDBTransaction,
  version: number,
) => {
  if (version === 3) migrateToNewDb(db, transaction);
};

const migrateToNewDb = (db: IDBDatabase, transaction: IDBTransaction) => {
  db.deleteObjectStore('motdRead');
  db.deleteObjectStore('roomAccess');
};
