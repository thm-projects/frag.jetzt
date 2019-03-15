import { Component, OnInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { RxStompService } from '@stomp/ng2-stompjs';
import { Message } from '@stomp/stompjs';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  comments: Comment[];
  isLoading = true;
  roomId: string;
  hideCommentsList: boolean;
  filteredComments: Comment[];

  constructor(private commentService: CommentService,
    private translateService: TranslateService,
    protected langService: LanguageService) {
    private rxStompService: RxStompService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    this.comments = [];
    this.hideCommentsList = false;
    this.rxStompService.watch(`/queue/${this.roomId}.comment.stream`).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
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

  searchComments(term: string): void {
    this.filteredComments = this.comments.filter(c => c.body.toLowerCase().includes(term));
  }

  parseIncomingMessage(message: Message) {
    console.log(message);
    const payload = JSON.parse(message.body).payload;
    const c = new Comment();
    c.roomId = this.roomId;
    c.subject = payload.subject;
    c.body = payload.body;

    this.comments.concat(c);
  }
}

