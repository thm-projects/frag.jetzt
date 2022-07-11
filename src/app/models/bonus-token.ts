export class BonusToken {
  roomId: string;
  commentId: string;
  userId: string;
  accountId: string;
  token: string;
  questionNumber: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    roomId: string,
    commentId: string,
    timestamp: Date,
    userId: string,
    token: string
  ) {
    this.roomId = roomId;
    this.commentId = commentId;
    this.userId = userId;
    this.token = token;
    this.accountId = this.userId;
    this.questionNumber = '?';
    this.createdAt = timestamp;
    this.updatedAt = null;
  }
}
