import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { CommentService } from '../../../services/http/comment.service';
import { Comment } from '../../../models/comment';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit {
  roomId: string;
  user: User;
  isLoading = true;
  comments: Comment[];

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              private authenticationService: AuthenticationService,
              private commentService: CommentService) { }

  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.user = this.authenticationService.getUser();
    this.getComments();
  }

  getComments(): void {
    this.commentService.getComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.isLoading = false;
      });
  }
}
