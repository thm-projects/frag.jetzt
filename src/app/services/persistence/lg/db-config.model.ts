import { FieldsOf } from 'app/utils/ts-utils';

export class Config {
  key: string;
  value: any;

  constructor({ key = null, value = null }: FieldsOf<Config>) {
    this.key = key;
    this.value = value;
  }
}

export const CONFIG_SCHEMA = {
  type: Config,
  since: 3,
  options: {
    keyPath: 'key' as const, // satisfies ValidKey<Config>,
  },
  indexes: {},
} as const; //satisfies DbStore<Config>;
