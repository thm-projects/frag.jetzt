import { DBConfig } from 'ngx-indexed-db';
import { User } from './app/models/user';

export const migrator: DBConfig['migrationFactory'] = () => {
  return {
    // 1: migrate to indexed db
    1: (_, transaction) => {
      // transform user data
      const currentUser = JSON.parse(localStorage.getItem('USER') || null) as User;
      const roomAccess = JSON.parse(localStorage.getItem('ROOM_ACCESS') || '[]') as string[];
      const loggedIn = localStorage.getItem('loggedin') === 'true';
      const motds = JSON.parse(localStorage.getItem('motds') || '[]') as string[];
      const configStore = transaction.objectStore('config');
      if (currentUser) {
        const isGuest = currentUser.type === 'guest' || !currentUser.loginId;
        configStore.put({ key: 'guestAccount', value: isGuest ? currentUser : null });
        configStore.put({ key: 'currentAccount', value: loggedIn ? currentUser : null });
        const roomAccessStore = transaction.objectStore('roomAccess');
        roomAccess.forEach(access => {
          roomAccessStore.put({
            userId: currentUser.id,
            roomShortId: access.substring(2),
            role: Number(access.substring(0, 1)),
          });
        });
        const motdReadStore = transaction.objectStore('motdRead');
        motds.forEach(motdId => {
          motdReadStore.put({
            userId: currentUser.id,
            motdId,
          });
        });
      } else {
        configStore.put({ key: 'guestAccount', value: null });
        configStore.put({ key: 'currentAccount', value: null });
      }
      localStorage.removeItem('USER');
      localStorage.removeItem('ROOM_ACCESS');
      localStorage.removeItem('loggedin');
      localStorage.removeItem('motds');
      // transform theme and language
      const language = localStorage.getItem('currentLang');
      const theme = localStorage.getItem('currentActiveTheme');
      configStore.put({ key: 'language', value: language });
      configStore.put({ key: 'theme', value: theme });
      localStorage.removeItem('currentLang');
      localStorage.removeItem('currentActiveTheme');
      // cookie consent
      const cookie = localStorage.getItem('cookieAccepted') === 'true';
      configStore.put({ key: 'cookieAccepted', value: cookie });
      localStorage.removeItem('cookieAccepted');
    },
    // 2: introduce new room settings
  };
};

export const DB_CONFIG: DBConfig = {
  name: 'frag.jetzt',
  version: 2,
  migrationFactory: migrator,
  objectStoresMeta: [
    {
      store: 'config',
      storeConfig: { keyPath: 'key', autoIncrement: false },
      storeSchema: [],
    },
    {
      store: 'comment',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'roomId', keypath: 'roomId', options: { unique: false } },
      ],
    },
    {
      store: 'room',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'shortId', keypath: 'shortId', options: { unique: true } },
      ],
    },
    {
      store: 'motd',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [],
    },
    {
      store: 'motdRead',
      storeConfig: { keyPath: ['motdId', 'userId'], autoIncrement: false },
      storeSchema: [
        { name: 'userId', keypath: 'userId', options: { unique: false } },
      ],
    },
    {
      store: 'roomAccess',
      storeConfig: { keyPath: ['userId', 'roomShortId'], autoIncrement: false },
      storeSchema: [
        { name: 'userId', keypath: 'userId', options: { unique: false } },
      ],
    },
    {
      store: 'moderator',
      storeConfig: { keyPath: ['roomId', 'accountId'], autoIncrement: false },
      storeSchema: [
        { name: 'roomId', keypath: 'roomId', options: { unique: false } },
      ],
    },
    {
      store: 'localRoomSettings',
      storeConfig: { keyPath: ['roomId', 'accountId'], autoIncrement: false },
      storeSchema: [
        { name: 'accountId', keypath: 'accountId', options: { unique: false } },
      ],
    }
  ]
};
