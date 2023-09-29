import { COMMENT_SCHEMA } from './db-comment.model';
import { CONFIG_SCHEMA } from './db-config.model';
import { MODERATOR_SCHEMA } from './db-moderator.model';
import { MOTD_SCHEMA } from './db-motd.model';
import { READ_MOTD_SCHEMA } from './db-read-motd.model';
import { ROOM_ACCESS_SCHEMA } from './db-room-acces.model';
import { ROOM_SCHEMA } from './db-room.model';
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
    room: ROOM_SCHEMA,
    moderator: MODERATOR_SCHEMA,
    comment: COMMENT_SCHEMA,
  },
} as const; // satisfies DatabaseSchema;
