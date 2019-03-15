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
import { RxStompService } from '@stomp/ng2-stompjs';
import { CreateComment } from '../../../models/messages/create-comment';

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
    private notification: NotificationService,
    private translationService: TranslateService,
    private rxStompService: RxStompService) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
  }

  send(subject: string, body: string): void {
    subject = subject.trim();
    body = body.trim();
    if (!subject && !body) {
      this.translationService.get('comment-page.error-both-fields').subscribe(translatedMessage => {
        this.notification.show(translatedMessage);
      });
      return;
    }
    if (!subject) {
      this.translationService.get('comment-page.error-title').subscribe(translatedMessage => {
        this.notification.show(translatedMessage);
      });
      return;
    }
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(translatedMessage => {
        this.notification.show(translatedMessage);
      });
      return;
    }
    const message = new CreateComment(this.roomId, this.user.id, subject, body);
    this.rxStompService.publish({
      destination: `/queue/comment.command`,
      body: JSON.stringify(message),
      headers: {
        'content-type': 'application/json'
      }
    });

    /*this.commentService.addComment({
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
      this.goBack();
    });*/
  }
}

