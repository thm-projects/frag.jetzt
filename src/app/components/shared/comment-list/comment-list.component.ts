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
    protected langService: LanguageService,
    private rxStompService: RxStompService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    this.comments = [];
    this.hideCommentsList = false;
    this.rxStompService.watch(`/topic/${this.roomId}.comment.stream`).subscribe((message: Message) => {
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
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    if (msg.type === 'CommentCreated') {
      const c = new Comment();
      c.roomId = this.roomId;
      c.body = payload.body;
      c.id = payload.id;
      c.creationTimestamp = payload.timestamp;
      this.comments = this.comments.concat(c);
    } else if (msg.type === 'CommentPatched') {
      const c = this.comments.find((comment: Comment) => comment.id === payload.id);
      if (c) {
        const index = this.comments.indexOf(c);
        console.log(index);
        const newList = this.comments.slice(0);
        const changes = payload.changes;
        // ToDo: there must be a better way to update the model
        for (const change of changes) {
          console.log(change);
          if (change.read) {
            c.read = change.read;
          } else if (change.favorite) {
            c.favorite = change.favorite;
          } else if (change.correct) {
            c.correct = change.correct;
          }
        }
        newList[index] = c;
        this.comments = newList;
      }
    }
  }
}

