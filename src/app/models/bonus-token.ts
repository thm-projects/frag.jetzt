export class BonusToken {
  roomId: string;
  userId: string;
  token: string;

  constructor(
    roomId: string,
    userId: string,
    token: string
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.token = token;
  }
}
