export abstract class AbstractVote {
  type: string;
  payload: {
    userId: string;
    commentId: string;
    vote: number;
  };

  protected constructor(type: string, userId: string, commentId: string, vote: number) {
    this.type = type;
    this.payload = {
      userId,
      commentId,
      vote
    };
  }
}
