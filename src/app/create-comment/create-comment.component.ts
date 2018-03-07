import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Room } from '../room';
import { RoomService } from '../room.service';
import { CommentService} from '../comment.service';

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
  ) { }

  ngOnInit(): void {
    // this.getRoom();
  }

  getRoom(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.roomService.getRoom(id)
      .subscribe(room => this.room = room);
  }

  send(subject: string, text: string): void {
    subject = subject.trim();
    text = text.trim();
    if (!subject || !text) { return; }
    this.commentService.addComment( { subject } as Comment )
      .subscribe();
  }

  goBack(): void {
    this.location.back();
  }
}
