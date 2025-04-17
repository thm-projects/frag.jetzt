import { FieldsOf } from 'app/utils/ts-utils';
import { DbStore, ValidKey } from '../data.types';
import { FormalityType } from 'app/services/http/deep-l.service';

export class LocalRoomSetting {
  accountId: string;
  roomId: string;
  pseudonym: string;
  formality?: FormalityType;

  constructor({
    accountId = null,
    roomId = null,
    pseudonym = null,
    formality = FormalityType.Less,
  }: FieldsOf<LocalRoomSetting>) {
    this.accountId = accountId;
    this.roomId = roomId;
    this.pseudonym = pseudonym;
    this.formality = formality;
  }
}

export const LOCAL_ROOM_SETTING_SCHEMA = {
  type: LocalRoomSetting,
  since: 3,
  options: {
    keyPath: [
      'roomId',
      'accountId',
    ] as const satisfies ValidKey<LocalRoomSetting>,
  },
  indexes: {
    'account-id': {
      since: 3,
      keyPath: 'accountId' satisfies ValidKey<LocalRoomSetting>,
    },
  },
} as const satisfies DbStore<LocalRoomSetting>;
