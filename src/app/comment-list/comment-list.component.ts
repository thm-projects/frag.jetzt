import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Comment } from '../comment';
import { CommentService } from '../comment.service';
import { RoomService } from '../room.service';
import { NotificationService } from '../notification.service';
import { AuthenticationService } from '../authentication.service';
import { UserRole } from '../user-roles.enum';
import { User } from '../user';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  userRoleTemp: any = UserRole.CREATOR;
  userRole: UserRole;
  user: User;
  comments: Comment[];
  isLoading = true;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private roomService: RoomService,
              private location: Location,
              private commentService: CommentService,
              private notification: NotificationService) {
  }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();
    this.user = this.authenticationService.getUser();
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(
      params => {
        this.getComments(params['id']);
      });
  }

  getComments(roomId: string): void {
    if (this.userRole === UserRole.CREATOR) {
      this.commentService.getComments(roomId)
        .subscribe(comments => {
          this.comments = comments;
          this.isLoading = false;
        });
    } else if (this.userRole === UserRole.PARTICIPANT) {
      this.commentService.searchComments(roomId, this.user.id)
        .subscribe(comments => {
          this.comments = comments;
          this.isLoading = false;
        });
    }
  }

  setRead(comment: Comment): void {
    this.comments.find(c => c.id === comment.id).read = !comment.read;
    this.commentService.updateComment(comment).subscribe();
  }

  delete(comment: Comment): void {
    this.comments = this.comments.filter(c => c !== comment);
    this.commentService.deleteComment(comment).subscribe(room => {
      this.notification.show(`Comment '${comment.subject}' successfully deleted.`);
    });
  }

  goBack(): void {
    this.location.back();
  }
}
