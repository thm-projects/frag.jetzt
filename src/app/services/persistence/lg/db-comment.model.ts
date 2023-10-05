import { Comment } from 'app/models/comment';

export const COMMENT_SCHEMA = {
  type: Comment,
  since: 1,
  options: {
    keyPath: 'id', // satisfies ValidKey<Comment>,
  },
  indexes: {
    'room-id': {
      since: 1,
      keyPath: 'roomId', // satisfies ValidKey<Comment>,
    },
  },
} as const; // satisfies DbStore<Comment>;
