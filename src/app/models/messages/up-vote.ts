import { AbstractVote } from './abstract-vote';

export class UpVote extends AbstractVote {
  type: string;
  payload: {
    userId: string;
    commentId: string;
    vote: number;
  };

  constructor(userId: string, commentId: string) {
    super('Upvote', userId, commentId, 1);
  }
}
