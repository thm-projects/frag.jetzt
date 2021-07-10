import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { CreateCommentComponent } from '../components/shared/_dialogs/create-comment/create-comment.component';
import { User } from '../models/user';
import { Room } from '../models/room';
import { Comment } from '../models/comment';
import { NotificationService } from '../services/util/notification.service';
import { UserRole } from '../models/user-roles.enum';
import { CommentService } from '../services/http/comment.service';

export class CreateCommentWrapper {
  constructor(private translateService: TranslateService,
              private notificationService: NotificationService,
              private commentService: CommentService,
              private dialog: MatDialog,
              private room: Room) {
  }

  openCreateDialog(user: User): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.user = user;
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.componentInstance.tags = this.room.tags || [];
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result) {
          this.send(result);
        } else {
          return;
        }
      });
  }

  send(comment: Comment): void {
    let message;
    if (this.room.directSend) {
      this.translateService.get('comment-list.comment-sent').subscribe(msg => {
        message = msg;
      });
      comment.ack = true;
    } else {
      this.translateService.get('comment-list.comment-sent-to-moderator').subscribe(msg => {
        message = msg;
      });
    }
    this.commentService.addComment(comment).subscribe(() => {
      this.notificationService.show(message);
    });
  }
}
