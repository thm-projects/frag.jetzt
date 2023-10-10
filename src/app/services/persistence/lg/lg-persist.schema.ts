import { COMMENT_SCHEMA } from './db-comment.model';
import { CONFIG_SCHEMA } from './db-config.model';
import { LOCAL_ROOM_SETTING_SCHEMA } from './db-local-room-setting.model';
import { MODERATOR_SCHEMA } from './db-moderator.model';
import { MOTD_SCHEMA } from './db-motd.model';
import { READ_MOTD_SCHEMA } from './db-read-motd.model';
import { ROOM_ACCESS_SCHEMA } from './db-room-acces.model';
import { ROOM_SCHEMA } from './db-room.model';
import { preMigrationStep } from './lg-persist.migration';
import {
  DatabaseSchema,
  buildDefaultMigrator,
} from './lg-persist.schema.types';

export const SCHEMA = {
  name: 'frag.jetzt',
  version: 3,
  migrator: buildDefaultMigrator({ preMigrateStep: preMigrationStep }),
  stores: {
    'read-motd': READ_MOTD_SCHEMA,
    'room-access': ROOM_ACCESS_SCHEMA,
    motd: MOTD_SCHEMA,
    config: CONFIG_SCHEMA,
    room: ROOM_SCHEMA,
    moderator: MODERATOR_SCHEMA,
    comment: COMMENT_SCHEMA,
    'local-room-setting': LOCAL_ROOM_SETTING_SCHEMA,
  },
} as const; // satisfies DatabaseSchema;
