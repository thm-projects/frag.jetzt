import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { CommentListComponent } from '../comment-list/comment-list.component';
import { MatDialog } from '@angular/material';
import { SubmitCommentComponent } from '../_dialogs/submit-comment/submit-comment.component';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit {
  @ViewChild(CommentListComponent) child: CommentListComponent;

  constructor(private route: ActivatedRoute,
              private commentService: CommentService,
              private notification: NotificationService,
              public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  openSubmitDialog(): void {
        const dialogRef = this.dialog.open(SubmitCommentComponent, {
          width: '400px'
        });
        dialogRef.afterClosed()
          .subscribe(result => {
            if (result !== null) {
              console.log(result);
              this.send(result);
            } else {
              return;
            }
          });
    }

  send(comment: Comment): void {
    this.commentService.addComment({
      id: '',
      roomId: comment.roomId,
      userId: comment.userId,
      subject: comment.subject,
      body: comment.body,
      creationTimestamp: comment.creationTimestamp,
      read: false,
      revision: ''
    } as Comment).subscribe(() => {
      this.child.getComments();
      this.notification.show(`Comment '${comment.subject}' successfully created.`);
    });

  }
}
