import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { CommentListComponent } from '../comment-list/comment-list.component';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { MatDialog } from '@angular/material';
import { SubmitCommentComponent } from '../_dialogs/submit-comment/submit-comment.component';
import { RxStompService } from '@stomp/ng2-stompjs';
import { CreateComment } from '../../../models/messages/create-comment';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit {
  roomId: string;
  user: User;

  @ViewChild(CommentListComponent) child: CommentListComponent;

  constructor(private route: ActivatedRoute,
              private commentService: CommentService,
              private notification: NotificationService,
              public dialog: MatDialog,
              private rxStompService: RxStompService,
              private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.roomId = localStorage.getItem("roomId");
    this.user = this.authenticationService.getUser();
  }

  openSubmitDialog(): void {
        const dialogRef = this.dialog.open(SubmitCommentComponent, {
          width: '400px'
        });
        dialogRef.componentInstance.user = this.user;
        dialogRef.componentInstance.roomId = this.roomId;
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
    /*this.commentService.addComment({
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
    });*/
    const message = new CreateComment(comment.roomId, comment.userId, comment.subject, comment.body);
    this.rxStompService.publish({
      destination: `/queue/comment.command`,
      body: JSON.stringify(message),
      headers: {
        'content-type': 'application/json'
      }
    });

  }
}
