import { CONFIG_SCHEMA } from './db-config.service';
import { MOTD_SCHEMA } from './db-motd.service';
import { READ_MOTD_SCHEMA } from './db-read-motd.service';
import { ROOM_ACCESS_SCHEMA } from './db-room-access.service';
import {
  DatabaseSchema,
  buildDefaultMigrator,
} from './lg-persist.schema.types';

export const SCHEMA = {
  name: 'frag.jetzt',
  version: 2,
  migrator: buildDefaultMigrator(),
  stores: {
    'read-motd': READ_MOTD_SCHEMA,
    'room-access': ROOM_ACCESS_SCHEMA,
    motd: MOTD_SCHEMA,
    config: CONFIG_SCHEMA,
  },
} as const; // satisfies DatabaseSchema;
