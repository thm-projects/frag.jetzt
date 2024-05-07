import { FieldsOf } from 'app/utils/ts-utils';
import { DbStore, ValidKey } from '../data.types';

export class Config {
  key: string;
  value: unknown;

  constructor({ key = null, value = null }: FieldsOf<Config>) {
    this.key = key;
    this.value = value;
  }
}

export const CONFIG_SCHEMA = {
  type: Config,
  since: 3,
  options: {
    keyPath: 'key' as const satisfies ValidKey<Config>,
  },
  indexes: {},
} as const satisfies DbStore<Config>;
