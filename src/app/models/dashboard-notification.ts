import { CommentChangeType } from './comment-change';
import { UserRole } from './user-roles.enum';
export class NotificationEvent{
    commentNr: string;
    roomName: string;
    event: CommentChangeType;
    createdAt: Date;
    changer: UserRole;
    type: string;
    prevVal: number;
    constructor(
        commentNr: string = '',
        roomName: string = '',
        event: CommentChangeType = null,
        createdAt: Date = null,
        changer: UserRole = null,
        type: string = '',
        prevVal: number = 0
    ) {
        this.commentNr = commentNr;
        this.roomName = roomName;
        this.event = event;
        this.createdAt = createdAt;
        this.changer = changer;
        this.type = type;
        this.prevVal = prevVal;
    }
}


