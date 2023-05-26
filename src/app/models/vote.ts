export class Vote {
  userId: string;
  commentId: string;
  vote: number;

  constructor(userId: string, commentId: string, vote: number) {
    this.userId = userId;
    this.commentId = commentId;
    this.vote = vote;
  }
}
