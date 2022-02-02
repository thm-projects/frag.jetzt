export class CommentNotification {
  id: string;
  accountId: string;
  roomId: string;
  notificationSetting: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string = null,
    accountId: string = null,
    roomId: string = null,
    notificationSetting: number = 0,
    createdAt = new Date(),
    updatedAt: Date = null
  ) {
    this.id = id;
    this.accountId = accountId;
    this.roomId = roomId;
    this.notificationSetting = notificationSetting;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

}
