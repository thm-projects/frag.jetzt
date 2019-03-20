import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { MatDialog } from '@angular/material';
import { SubmitCommentComponent } from '../_dialogs/submit-comment/submit-comment.component';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit {
  roomId: string;
  user: User;

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              public dialog: MatDialog,
              private authenticationService: AuthenticationService,
              private wsCommentService: WsCommentServiceService) { }

  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.user = this.authenticationService.getUser();
  }

  openSubmitDialog(): void {
        const dialogRef = this.dialog.open(SubmitCommentComponent, {
          width: '400px'
        });
        dialogRef.componentInstance.user = this.user;
        dialogRef.componentInstance.roomId = this.roomId;
        dialogRef.afterClosed()
          .subscribe(result => {
            if (result) {
              this.send(result);
            } else {
              return;
            }
          });
    }

  send(comment: Comment): void {
    this.wsCommentService.add(comment);
  }
}
