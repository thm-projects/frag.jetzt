export enum CommentChangeType {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
  ANSWERED = 'ANSWERED',
  CHANGE_ACK = 'CHANGE_ACK',
  CHANGE_FAVORITE = 'CHANGE_FAVORITE',
  CHANGE_CORRECT = 'CHANGE_CORRECT',
  CHANGE_TAG = 'CHANGE_TAG',
  CHANGE_SCORE = 'CHANGE_SCORE',
}

export enum CommentChangeRole {
  PARTICIPANT = 'PARTICIPANT',
  EDITING_MODERATOR = 'EDITING_MODERATOR',
  EXECUTIVE_MODERATOR = 'EXECUTIVE_MODERATOR',
  CREATOR = 'CREATOR',
}

export class CommentChange {
  id: string;
  commentId: string;
  roomId: string;
  type: CommentChangeType;
  previousValueString: string;
  currentValueString: string;
  createdAt: Date;
  updatedAt: Date;
  initiatorId: string;
  initiatorRole: CommentChangeRole;
  commentCreatorId: string;
  commentNumber: string;
  isAnswer: boolean;
  roomName: string;
  roomShortId: string;

  constructor(
    id: string = '',
    commentId: string = '',
    roomId: string = '',
    type: CommentChangeType = null,
    previousValueString: string = null,
    currentValueString: string = null,
    createdAt: Date = null,
    updatedAt: Date = null,
    initiatorId: string = '',
    initiatorRole: CommentChangeRole = null,
    commentCreatorId: string = '',
    commentNumber: string = '',
    isAnswer: boolean = false,
    roomName: string = '',
    roomShortId: string = '',
  ) {
    this.id = id;
    this.commentId = commentId;
    this.roomId = roomId;
    this.type = type;
    this.previousValueString = previousValueString;
    this.currentValueString = currentValueString;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.initiatorId = initiatorId;
    this.initiatorRole = initiatorRole;
    this.commentCreatorId = commentCreatorId;
    this.commentNumber = commentNumber;
    this.isAnswer = isAnswer;
    this.roomName = roomName;
    this.roomShortId = roomShortId;
  }
}
