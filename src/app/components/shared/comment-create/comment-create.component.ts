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

@Component({
  selector: 'app-comment-create',
  templateUrl: './comment-create.component.html',
  styleUrls: ['./comment-create.component.scss']
})
export class CommentCreateComponent implements OnInit {

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
    private translationService: TranslateService) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
  }

  send(subject: string, body: string): void {
    subject = subject.trim();
    body = body.trim();
    if (!subject && !body) {
      this.translationService.get('comment-page.error-both-fields').subscribe(message => {
        this.notification.show(message);
      });
      return;
    }
    if (!subject) {
      this.translationService.get('comment-page.error-title').subscribe(message => {
        this.notification.show(message);
      });
      return;
    }
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return;
    }
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
