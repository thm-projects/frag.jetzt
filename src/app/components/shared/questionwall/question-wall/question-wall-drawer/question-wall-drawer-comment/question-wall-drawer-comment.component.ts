import { Component, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { NgIf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../../../../../models/user';
import { SessionService } from '../../../../../../services/util/session.service';
import { CommentService } from '../../../../../../services/http/comment.service';
import { MatChip } from '@angular/material/chips';
import { QuestionWallCommentOptionsComponent } from '../../question-wall-comment-options/question-wall-comment-options.component';

export interface QuestionWallActions {
  filterTag(tag: string): void;

  likeComment(comment: ForumComment): void;

  dislikeComment(comment: ForumComment): void;

  openConversation(comment: ForumComment): void;

  focusComment(comment: ForumComment): void;
}

export interface QuestionWallContext {
  user: User;
  actions: QuestionWallActions;
}

export interface QuestionWallCommentContext extends QuestionWallContext {
  comment: ForumComment;
}

@Component({
  selector: 'app-question-wall-drawer-comment',
  standalone: true,
  imports: [
    NgIf,
    MatButton,
    MatIcon,
    MatChip,
    QuestionWallCommentOptionsComponent,
  ],
  templateUrl: './question-wall-drawer-comment.component.html',
  styleUrl: './question-wall-drawer-comment.component.scss',
})
export class QuestionWallDrawerCommentComponent {
  @Input() data: QuestionWallCommentContext | undefined;

  constructor(
    public readonly sessionService: SessionService,
    public readonly commentService: CommentService,
  ) {}
}
