export class ResetVote {
  type: string;
  payload: {
    userId: string;
    commentId: string;
  };

  constructor(userId: string, commentId: string) {
    this.type = 'ResetVote';
    this.payload = {
      userId,
      commentId
    };
  }
}
