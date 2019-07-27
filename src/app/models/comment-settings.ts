export class CommentSettings {
  roomId: string;
  directSend: boolean;

  constructor(
    roomId: string = '',
    directSend: boolean = true
  ) {
    this.roomId = roomId;
    this.directSend = directSend;
  }
}
