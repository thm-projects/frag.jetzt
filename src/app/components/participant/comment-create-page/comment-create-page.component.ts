import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { CommentListComponent } from '../../shared/comment-list/comment-list.component';
import { MatDialog } from '@angular/material';
import { SubmitCommentComponent } from '../_diaglogs/submit-comment/submit-comment.component';

@Component({
  selector: 'app-comment-create-page',
  templateUrl: './comment-create-page.component.html',
  styleUrls: ['./comment-create-page.component.scss']
})
export class CommentCreatePageComponent implements OnInit {
  @ViewChild(CommentListComponent) child: CommentListComponent;
  roomId: string;
  roomShortId: string;
  user: User;
  private date = new Date(Date.now());
  subjectForm = new FormControl('', [Validators.required]);
  bodyForm = new FormControl('', [Validators.required]);


  constructor(
    protected authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private commentService: CommentService,
    private notification: NotificationService,
    public dialog: MatDialog,
    private translationService: TranslateService) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
  }

  pressSend(subject: string, body: string): void {
    if (this.checkInputData(subject, body)) {
      this.openSubmitDialog(subject, body);
    }
  }


  openSubmitDialog(subject: string, body: string): void {

        const dialogRef = this.dialog.open(SubmitCommentComponent, {
          width: '400px'
        });
        dialogRef.componentInstance.comment = new Comment();
        dialogRef.componentInstance.comment.subject = subject;
        dialogRef.componentInstance.comment.body = body;
        dialogRef.afterClosed()
          .subscribe(result => {
            if (result === 'send') {
              this.send(subject, body);
            } else {
              return;
            }
          });
    }

  checkInputData(subject: string, body: string): boolean {
    subject = subject.trim();
    body = body.trim();
    if (!subject && !body) {
      this.translationService.get('comment-page.error-both-fields').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    if (!subject) {
      this.translationService.get('comment-page.error-title').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
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
