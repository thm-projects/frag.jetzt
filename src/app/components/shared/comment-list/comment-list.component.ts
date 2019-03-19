import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
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
  private searchTerms = new Subject<string>();
  comments$: Observable<Comment[]>;

  constructor(private commentService: CommentService,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
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
