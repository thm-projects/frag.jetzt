import { FieldsOf, verifyInstance } from 'app/utils/ts-utils';
import { DbStore, ValidKey } from '../data.types';

export const ROOM_ROLE_ORDER = ['Participant', 'Moderator', 'Creator'] as const;
export type RoomAccessRole = (typeof ROOM_ROLE_ORDER)[number];

export class RoomAccess {
  userId: string;
  roomShortId: string;
  roomId: string;
  role: RoomAccessRole;
  lastAccess: Date;

  constructor({
    userId = null,
    roomShortId = null,
    roomId = null,
    role = 'Participant',
    lastAccess = new Date(),
  }: FieldsOf<RoomAccess>) {
    this.userId = userId;
    this.roomShortId = roomShortId;
    this.roomId = roomId;
    this.role = role;
    this.lastAccess = verifyInstance(Date, lastAccess);
  }
}

export const ROOM_ACCESS_SCHEMA = {
  type: RoomAccess,
  since: 3,
  options: {
    keyPath: ['userId', 'roomShortId'] as const satisfies ValidKey<RoomAccess>,
  },
  indexes: {
    'user-id': {
      since: 3,
      keyPath: 'userId' satisfies ValidKey<RoomAccess>,
    },
  },
} as const satisfies DbStore<RoomAccess>;
