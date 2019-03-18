import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { RoomService } from '../../../services/http/room.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  userRole: UserRole;
  user: User;
  comments: Comment[];
  isLoading = true;
  roomId: string;
  roomShortId: string;
  private searchTerms = new Subject<string>();
  comments$: Observable<Comment[]>;

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
     this.comments$ = this.searchTerms.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      // switch to new search observable each time the term changes
      switchMap((term: string) => this.commentService.searchComments(this.roomId, term)),
    ); 
    this.translateService.use(localStorage.getItem('currentLang')); 
  }

  getComments(): void {
      this.commentService.getComments(this.roomId)
        .subscribe(comments => {
          this.comments = comments;
          this.isLoading = false;
        });
  }
}
