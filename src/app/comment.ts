export class Comment {
  id: string;
  roomId: string;
  revision: string;
  subject: string;
  body: string;
  read: boolean;
  creationTimestamp: Date;

  constructor(id: string, roomId: string, subject: string, body: string, creationTimestamp: Date) {
    this.id = id;
    this.roomId = roomId;
    this.revision = null;
    this.subject = subject;
    this.body = body;
    this.read = false;
    this.creationTimestamp = creationTimestamp;
  }
}
