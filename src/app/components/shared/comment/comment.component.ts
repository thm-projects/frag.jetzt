import { Component, Input, OnInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  userRoleTemp: any = UserRole.CREATOR;
  userRole: UserRole;
  user: User;
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
    langService.langEmitter.subscribe(lang => translateService.use(lang)); }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();
    this.user = this.authenticationService.getUser();
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
    this.translateService.use(localStorage.getItem('currentLang'));
  }
  setRead(comment: Comment): void {
    this.commentService.updateComment(comment).subscribe();
  }

  delete(comment: Comment): void {
    this.commentService.deleteComment(comment.id).subscribe(room => {
      this.notification.show(`Comment '${comment.subject}' successfully deleted.`);
    });
  }
}
