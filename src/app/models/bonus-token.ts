export class BonusToken {
  roomId: string;
  commentId: string;
  userId: string;
  token: string;

  constructor(
    roomId: string,
    commentId: string,
    userId: string,
    token: string
  ) {
    this.roomId = roomId;
    this.commentId = commentId;
    this.userId = userId;
    this.token = token;
  }
}
