export class Vote {
  id: string;
  userId: string;
  commentId: string;
  vote: number;

  constructor(userId: string ,
              commentId: string,
              vote: number) {
    this.id = '';
    this.userId = userId;
    this.commentId = commentId;
    this.vote = vote;
  }
}
