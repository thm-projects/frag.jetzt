import { FieldsOf } from 'app/utils/ts-utils';

export class ReadMotd {
  userId: string;
  motdId: string;

  constructor({ userId = null, motdId = null }: FieldsOf<ReadMotd>) {
    this.userId = userId;
    this.motdId = motdId;
  }
}

export const READ_MOTD_SCHEMA = {
  type: ReadMotd,
  since: 3,
  options: {
    keyPath: ['motdId', 'userId'] as const, // satisfies ValidKey<ReadMotd>,
  },
  indexes: {
    'user-id': {
      since: 3,
      keyPath: 'userId', // satisfies ValidKey<ReadMotd>,
    },
  },
} as const; // satisfies DbStore<ReadMotd>;
