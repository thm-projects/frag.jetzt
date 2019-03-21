export class Comment {
  id: string;
  roomId: string;
  userId: string;
  revision: string;
  body: string;
  read: boolean;
  correct: boolean;
  favorite: boolean;
  creationTimestamp: Date;
  score: number;
  createdFromDozent: boolean;

  constructor(roomId: string = '',
              userId: string = '',
              body: string = '',
              read: boolean = false,
              correct: boolean = false,
              favorite: boolean = false,
              creationTimestamp: Date = null,
              score: number = 0,
              createdFromDozent = false) {
    this.id = '';
    this.roomId = roomId;
    this.userId = userId;
    this.revision = '';
    this.body = body;
    this.read = read;
    this.correct = correct;
    this.favorite = favorite;
    this.creationTimestamp = creationTimestamp;
    this.score = score;
    this.createdFromDozent = createdFromDozent;
  }
}
