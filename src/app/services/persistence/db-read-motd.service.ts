import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';
import { FieldsOf } from 'app/utils/ts-utils';
import { DbStore } from './lg-persist.schema.types';

export class ReadMOTD {
  userId: string;
  motdId: string;

  constructor({ userId = null, motdId = null }: FieldsOf<ReadMOTD>) {
    this.userId = userId;
    this.motdId = motdId;
  }
}

export const READ_MOTD_SCHEMA = {
  type: ReadMOTD,
  since: 1,
  options: {
    keyPath: ['motdId', 'userId'],
  },
  indexes: {
    'user-id': {
      since: 1,
      keyPath: 'userId',
    },
  },
} satisfies DbStore<ReadMOTD>;

@Injectable({
  providedIn: 'root',
})
export class DbReadMotdService extends LgDbBaseService<'read-motd'> {
  constructor() {
    super('read-motd');
  }
}
