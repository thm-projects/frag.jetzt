export class Comment {
  id: string;
  roomId: string;
  userId: string;
  revision: string;
  body: string;
  read: boolean;
  correct: boolean;
  favorite: boolean;
  creationTimestamp: number;

  constructor(roomId: string = '',
              userId: string = '',
              body: string = '',
              read: boolean = false,
              correct: boolean = false,
              favorite: boolean = false,
              creationTimestamp: number = 0) {
    this.id = '';
    this.roomId = roomId;
    this.userId = userId;
    this.revision = '';
    this.body = body;
    this.read = read;
    this.correct = correct;
    this.favorite = favorite;
    this.creationTimestamp = creationTimestamp;
  }
}
