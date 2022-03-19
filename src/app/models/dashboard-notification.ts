import { CommentChange } from './comment-change';

export class NotificationEvent extends CommentChange {
  commentNr: string;
  roomName: string;
  roomShortId: string;
  commentCreatorId: string;
  isAnswer: boolean;
  //computed
  fromSelf: boolean;
  ownsComment: boolean;
}


