export class Comment {
  id: string;
  roomId: string;
  userId: number;
  revision: string;
  subject: string;
  body: string;
  read: boolean;
  creationTimestamp: Date;
}
