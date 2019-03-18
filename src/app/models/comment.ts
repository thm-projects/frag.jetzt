export class Comment {
  id: string;
  roomId: string;
  userId: string;
  revision: string;
  subject: string;
  body: string;
  read: boolean;
  correct: boolean;
  creationTimestamp: number;
}
