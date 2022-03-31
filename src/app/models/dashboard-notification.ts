import { CommentChange } from './comment-change';

export class NotificationEvent extends CommentChange {
  fromSelf: boolean;
  ownsComment: boolean;
}


