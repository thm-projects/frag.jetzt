import { AbstractVote } from './abstract-vote';

export class DownVote extends AbstractVote {
  type: string;
  payload: {
    userId: string;
    commentId: string;
    vote: number;
  };

  constructor(userId: string, commentId: string) {
    super('Downvote', userId, commentId, -1);
  }
}
