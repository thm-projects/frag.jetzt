import { Injectable } from '@angular/core';
import { FieldsOf } from 'app/utils/ts-utils';
import { LgDbBaseService } from './lg-db-base.service';

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
  since: 1,
  options: {
    keyPath: 'key' as const, // satisfies ValidKey<Config>,
  },
  indexes: {},
} as const; //satisfies DbStore<Config>;

@Injectable({
  providedIn: 'root',
})
export class DbConfigService extends LgDbBaseService<'config'> {
  constructor() {
    super('config');
  }
}
