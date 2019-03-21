export class Vote {
  private id: string;
  private userId: string;
  private commentId: string;
  private vote: number;

  constructor(userId: string ,
              commentId: string,
              vote: number) {
    this.id = '';
    this.userId = userId;
    this.commentId = commentId;
    this.vote = vote;
  }
}
