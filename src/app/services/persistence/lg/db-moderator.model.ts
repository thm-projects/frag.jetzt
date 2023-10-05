import { FieldsOf } from 'app/utils/ts-utils';

export class Moderator {
  roomId: string;
  accountId: string;

  constructor({ roomId = null, accountId = null }: FieldsOf<Moderator>) {
    this.roomId = roomId;
    this.accountId = accountId;
  }
}

export const MODERATOR_SCHEMA = {
  type: Moderator,
  since: 1,
  options: {
    keyPath: ['roomId', 'accountId'] as const, // satisfies ValidKey<Moderator>,
  },
  indexes: {
    'room-id': {
      since: 1,
      keyPath: 'roomId', // satisfies ValidKey<Moderator>,
    },
  },
} as const; // satisfies DbStore<Moderator>;
