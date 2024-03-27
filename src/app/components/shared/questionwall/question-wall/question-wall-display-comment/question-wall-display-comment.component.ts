import { Component, Input } from '@angular/core';
import { CommentService } from '../../../../../services/http/comment.service';
import { QuestionWallCommentContext } from '../question-wall-drawer/question-wall-drawer-comment/question-wall-drawer-comment.component';
import { QuestionWallCommentOptionsComponent } from '../question-wall-comment-options/question-wall-comment-options.component';

@Component({
  selector: 'app-question-wall-display-comment',
  standalone: true,
  imports: [QuestionWallCommentOptionsComponent],
  templateUrl: './question-wall-display-comment.component.html',
  styleUrl: './question-wall-display-comment.component.scss',
})
export class QuestionWallDisplayCommentComponent {
  @Input() data: QuestionWallCommentContext | undefined;
  constructor(public readonly commentService: CommentService) {}
}
