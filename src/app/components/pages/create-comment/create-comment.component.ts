import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Room } from '../../../models/room';
import { Comment } from '../../../models/comment';
import { RoomService } from '../../../room.service';
import { CommentService } from '../../../comment.service';
import { NotificationService } from '../../../notification.service';
import { AuthenticationService } from '../../../authentication.service';
import { User } from '../../../models/user';
import { CommentListComponent } from '../../fragments/comment-list/comment-list.component';

@Component({
  selector: 'app-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {
  @ViewChild(CommentListComponent) child: CommentListComponent;
  @Input() room: Room;
  user: User;

  constructor(
    protected authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private roomService: RoomService,
    private commentService: CommentService,
    private location: Location,
    private notification: NotificationService) { }

  ngOnInit(): void {
    this.user = this.authenticationService.getUser();
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => this.room = room);
  }

  send(subject: string, body: string): void {
    subject = subject.trim();
    body = body.trim();
    if (!subject || !body) {
      return;
    }
    this.commentService.addComment({
      id: '',
      roomId: this.room.id,
      userId: this.user.id,
      subject: subject,
      body: body,
      creationTimestamp: new Date(Date.now())
    } as Comment).subscribe(() => {
      this.child.getComments(this.room.id);
      this.notification.show(`Comment '${subject}' successfully created.`);
    });
  }

  goBack(): void {
    this.location.back();
  }
}
