import { Room } from 'app/models/room';

export const ROOM_SCHEMA = {
  type: Room,
  since: 1,
  options: {
    keyPath: 'id', // satisfies ValidKey<Room>,
  },
  indexes: {
    'short-id': {
      since: 1,
      keyPath: 'shortId', // satisfies ValidKey<Room>,
    },
  },
} as const; // satisfies DbStore<Room>;
