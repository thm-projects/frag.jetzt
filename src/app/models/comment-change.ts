export enum CommentChangeType {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
  ANSWERED = 'ANSWERED',
  CHANGE_ACK = 'CHANGE_ACK',
  CHANGE_FAVORITE = 'CHANGE_FAVORITE',
  CHANGE_CORRECT = 'CHANGE_CORRECT',
  CHANGE_TAG = 'CHANGE_TAG',
  CHANGE_SCORE = 'CHANGE_SCORE'
}

export class CommentChange {
  id: string;
  commentId: string;
  roomId: string;
  type: CommentChangeType;
  previousValueString: string;
  previousValueNumber: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string = '',
    commentId: string = '',
    roomId: string = '',
    type: CommentChangeType = null,
    previousValueString: string = null,
    previousValueNumber: number = null,
    createdAt: Date = null,
    updatedAt: Date = null,
  ) {
    this.id = id;
    this.commentId = commentId;
    this.roomId = roomId;
    this.type = type;
    this.previousValueString = previousValueString;
    this.previousValueNumber = previousValueNumber;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
