import {Component, OnInit, Input, Inject} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Room } from '../room';
import { Comment } from '../comment';
import { RoomService } from '../room.service';
import { CommentService} from '../comment.service';
import { NotificationService } from '../notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {
  @Input() room: Room;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private commentService: CommentService,
    private location: Location,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

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
      this.notification.show(`Comment '${subject}' successfully created.`);
      this.dialogRef.close();
    });
  }

  goBack(): void {
    this.location.back();
  }
}
