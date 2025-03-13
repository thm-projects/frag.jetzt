import { FieldsOf } from 'app/utils/ts-utils';
import { DbStore, ValidKey } from '../data.types';

export class Motd {
  id: string;
  startTimestamp: Date;
  endTimestamp: Date;
  messages: { [key: string]: { language: string; message: string } };

  constructor({
    id = null,
    startTimestamp = null,
    endTimestamp = null,
    messages = {},
  }: FieldsOf<Motd>) {
    this.id = id;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
    this.messages = messages;
  }
}

export const MOTD_SCHEMA = {
  type: Motd,
  since: 3,
  options: {
    keyPath: ['id'] as const satisfies ValidKey<Motd>,
  },
  indexes: {},
} as const satisfies DbStore<Motd>;
