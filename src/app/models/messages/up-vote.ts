import { AbstractVote } from './abstract-vote';

export class UpVote extends AbstractVote {
  override type: string;
  override payload: {
    userId: string;
    commentId: string;
    vote: number;
  };

  constructor(userId: string, commentId: string) {
    super('Upvote', userId, commentId, 1);
  }
}
