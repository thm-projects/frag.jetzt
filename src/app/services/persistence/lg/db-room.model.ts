import { Room } from 'app/models/room';
import { DbStore, ValidKey } from './lg-persist.schema.types';

export const ROOM_SCHEMA = {
  type: Room,
  since: 3,
  options: {
    keyPath: 'id' satisfies ValidKey<Room>,
  },
  indexes: {
    'short-id': {
      since: 3,
      keyPath: 'shortId' satisfies ValidKey<Room>,
    },
  },
} as const satisfies DbStore<Room>;
