import { READ_MOTD_SCHEMA } from './db-read-motd.service';
import {
  DatabaseSchema,
  buildDefaultMigrator,
} from './lg-persist.schema.types';

export const SCHEMA = {
  name: 'frag.jetzt',
  version: 1,
  migrator: buildDefaultMigrator(),
  stores: {
    'read-motd': READ_MOTD_SCHEMA,
  },
} as const satisfies DatabaseSchema;