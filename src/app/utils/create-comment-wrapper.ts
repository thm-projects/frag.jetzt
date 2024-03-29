import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { CreateCommentComponent } from '../components/shared/_dialogs/create-comment/create-comment.component';
import { User } from '../models/user';
import { Room } from '../models/room';
import { Comment } from '../models/comment';
import { NotificationService } from '../services/util/notification.service';
import { CommentService } from '../services/http/comment.service';
import { Observable, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { UserRole } from '../models/user-roles.enum';
import { BrainstormingSession } from '../models/brainstorming-session';

export class CreateCommentWrapper {
  constructor(
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private commentService: CommentService,
    private dialog: MatDialog,
    private room: Room,
  ) {}

  openCreateDialog(
    user: User,
    userRole: UserRole,
    brainstormingData: BrainstormingSession = undefined,
    commentOverride?: Partial<Comment>,
  ): Observable<Comment> {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '650px',
      maxWidth: '100%',
      maxHeight: 'calc( 100vh - 20px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.userRole = userRole;
    dialogRef.componentInstance.tags =
      (!brainstormingData && this.room.tags) || [];
    dialogRef.componentInstance.brainstormingData = brainstormingData;
    return dialogRef.afterClosed().pipe(
      mergeMap((comment: Comment) => {
        if (commentOverride && comment) {
          for (const key of Object.keys(commentOverride)) {
            comment[key] = commentOverride[key];
          }
        }
        return comment ? this.send(comment) : of<Comment>(null);
      }),
    );
  }

  send(comment: Comment): Observable<Comment> {
    let message;
    const config: MatSnackBarConfig = {
      panelClass: ['snackbar'],
    };
    if (this.room.directSend) {
      this.translateService
        .get('comment-list.comment-sent')
        .subscribe((msg) => {
          message = msg;
        });
      comment.ack = true;
    } else {
      this.translateService
        .get('comment-list.comment-sent-to-moderator')
        .subscribe((msg) => {
          message = msg;
          (config.panelClass as string[]).push('important');
        });
    }
    return this.commentService
      .addComment(comment)
      .pipe(tap(() => this.notificationService.show(message, null, config)));
  }
}
