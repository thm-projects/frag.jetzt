import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  comments: Comment[];
  isLoading = true;
  roomId: string;
  private hideCommentsList: boolean;
  private comments$: Observable<Comment[]>;

  constructor(private commentService: CommentService,
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
    this.roomId = localStorage.getItem(`roomId`);
    this.hideCommentsList = false;
    this.getComments();
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  getComments(): void {
    this.commentService.getComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.isLoading = false;
      });
  }

  search(term: string): void {
  }
}
