import { Comment } from 'app/models/comment';
import { DbStore, ValidKey } from '../data.types';

export const COMMENT_SCHEMA = {
  type: Comment,
  since: 3,
  options: {
    keyPath: 'id' satisfies ValidKey<Comment>,
  },
  indexes: {
    'room-id': {
      since: 3,
      keyPath: 'roomId' satisfies ValidKey<Comment>,
    },
  },
} as const satisfies DbStore<Comment>;
