import { DatabaseSchema, buildDefaultMigrator } from './data.types';
import { preMigrationStep } from './migrations/migrator';
import { COMMENT_SCHEMA } from './models/db-comment';
import { CONFIG_SCHEMA } from './models/db-config';
import { LOCAL_ROOM_SETTING_SCHEMA } from './models/db-local-room-setting';
import { MODERATOR_SCHEMA } from './models/db-moderator';
import { MOTD_SCHEMA } from './models/db-motd';
import { READ_MOTD_SCHEMA } from './models/db-read-motd';
import { ROOM_SCHEMA } from './models/db-room';
import { ROOM_ACCESS_SCHEMA } from './models/db-room-access.model';

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
} as const satisfies DatabaseSchema;
