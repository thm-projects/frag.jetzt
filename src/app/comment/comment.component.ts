import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Comment } from '../comment';
import { CommentService} from '../comment.service';
import { RoomService } from '../room.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  comments: Comment[];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private location: Location,
    private commentService: CommentService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(
      params => {
        this.getComments(params['id']);
      }
    );
  }

  getComments(roomId: string): void {
    this.commentService.getComments(roomId)
      .subscribe(comments => this.comments = comments);
  }

  goBack(): void {
    this.location.back();
  }
}
