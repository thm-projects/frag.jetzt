import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { RoomService } from '../../../services/http/room.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import {TranslateService} from "@ngx-translate/core";
import {LanguageService} from "../LanguageService";

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
  roomId: string;
  roomShortId: string;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private roomService: RoomService,
              private location: Location,
              private commentService: CommentService,
              private notification: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
    this.getComments();
    this.translateService.use(sessionStorage.getItem('currentLang'));
  }

  getComments(): void {
      this.commentService.getComments(this.roomId)
        .subscribe(comments => {
          this.comments = comments;
          this.isLoading = false;
        });
  }

  setRead(comment: Comment): void {
    this.comments.find(c => c.id === comment.id).read = !comment.read;
    this.commentService.updateComment(comment).subscribe();
  }

  delete(comment: Comment): void {
    this.comments = this.comments.filter(c => c !== comment);
    this.commentService.deleteComment(comment.id).subscribe(room => {
      this.notification.show(`Comment '${comment.subject}' successfully deleted.`);
    });
  }
}
