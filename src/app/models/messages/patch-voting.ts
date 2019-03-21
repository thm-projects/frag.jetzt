export class PatchVoting {
  type: string;
  payload: {
    userId: string;
    commentId: string;
    vote: number;
  };

  constructor(userId: string, commentId: string, vote: number) {
    this.type = 'PatchComment';
    this.payload = {
      userId: userId,
      commentId: commentId,
      vote: vote
    };
  }
}
