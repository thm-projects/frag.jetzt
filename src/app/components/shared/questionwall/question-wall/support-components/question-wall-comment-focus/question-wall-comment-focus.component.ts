import { Component, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { QuestionWallService } from '../../question-wall.service';

@Component({
  selector: 'app-question-wall-comment-focus',
  standalone: true,
  imports: [],
  templateUrl: './question-wall-comment-focus.component.html',
  styleUrl: './question-wall-comment-focus.component.scss',
})
export class QuestionWallCommentFocusComponent {
  @Input() comment!: ForumComment;
  constructor(public readonly self: QuestionWallService) {}
}
