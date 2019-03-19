import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
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
  roomId: string;
  roomShortId: string;
  user: User;
  private date = new Date(Date.now());



  constructor(
    protected authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private commentService: CommentService,
    private notification: NotificationService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
  }

  openSubmitDialog(): void {

        const dialogRef = this.dialog.open(SubmitCommentComponent, {
          width: '400px'
        });
        dialogRef.afterClosed()
          .subscribe(result => {
            if (result !== null) {
              this.send(result);
            } else {
              return;
            }
          });
    }

  send(subject: string, body: string): void {
    this.commentService.addComment({
      id: '',
      roomId: this.roomId,
      userId: this.user.id,
      subject: subject,
      body: body,
      creationTimestamp: this.date.getTime(),
      read: false,
      revision: ''
    } as Comment).subscribe(() => {
      this.child.getComments();
      this.notification.show(`Comment '${subject}' successfully created.`);
    });
  }
}
