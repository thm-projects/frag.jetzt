export class Bookmark {
  id: string;
  accountId: string;
  roomId: string;
  commentId: string;

  constructor(
    accountId = '',
    roomId = '',
    commentId = ''
  ) {
    this.accountId = accountId;
    this.roomId = roomId;
    this.commentId = commentId;
  }
}
