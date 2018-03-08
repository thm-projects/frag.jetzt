export class Comment {
  id: string;
  roomId: string;
  revision?: string;
  subject: string;
  body: string;
  read?: boolean;
  creationTimestamp: Date;
}
