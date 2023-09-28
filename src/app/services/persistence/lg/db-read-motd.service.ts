import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';
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
  since: 1,
  options: {
    keyPath: ['motdId', 'userId'] as const, // satisfies ValidKey<ReadMotd>,
  },
  indexes: {
    'user-id': {
      since: 1,
      keyPath: 'userId', // satisfies ValidKey<ReadMotd>,
    },
  },
} as const; // satisfies DbStore<ReadMotd>;

@Injectable({
  providedIn: 'root',
})
export class DbReadMotdService extends LgDbBaseService<'read-motd'> {
  constructor() {
    super('read-motd');
  }
}
