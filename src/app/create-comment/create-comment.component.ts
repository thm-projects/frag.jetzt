import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Room } from '../room';
import { Comment } from '../comment';
import { RoomService } from '../room.service';
import { CommentService} from '../comment.service';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {
  @Input() room: Room;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private roomService: RoomService,
    private commentService: CommentService,
    private location: Location,
    private notification: NotificationService) { }

  ngOnInit(): void {
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
      roomId: this.room.id,
      subject: subject,
      body: body,
      creationTimestamp: new Date(Date.now())
    } as Comment).subscribe(room => {
      this.router.navigate([`room/${this.room.id}`]);
      this.notification.show(`Comment '${subject}' successfully created.`);
    });
  }

  goBack(): void {
    this.location.back();
  }
}
