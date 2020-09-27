export class BonusToken {
  roomId: string;
  commentId: string;
  timestamp: Date;
  userId: string;
  token: string;

  constructor(
    roomId: string,
    commentId: string,
    timestamp: Date,
    userId: string,
    token: string
  ) {
    this.roomId = roomId;
    this.commentId = commentId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.token = token;
  }
}
