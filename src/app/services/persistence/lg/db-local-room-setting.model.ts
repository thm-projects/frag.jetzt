import { FieldsOf } from 'app/utils/ts-utils';

export class LocalRoomSetting {
  accountId: string;
  roomId: string;
  pseudonym: string;

  constructor({
    accountId = null,
    roomId = null,
    pseudonym = null,
  }: FieldsOf<LocalRoomSetting>) {
    this.accountId = accountId;
    this.roomId = roomId;
    this.pseudonym = pseudonym;
  }
}

export const LOCAL_ROOM_SETTING_SCHEMA = {
  type: LocalRoomSetting,
  since: 3,
  options: {
    keyPath: ['roomId', 'accountId'] as const, // satisfies ValidKey<Config>,
  },
  indexes: {
    'account-id': {
      since: 3,
      keyPath: 'accountId', // satisfies ValidKey<Comment>,
    },
  },
} as const; //satisfies DbStore<Config>;
