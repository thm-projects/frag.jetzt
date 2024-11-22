import { Component, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { QuestionWallService } from '../../question-wall.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-footer',
  imports: [MatButton, MatIcon],
  templateUrl: './qw-comment-footer.component.html',
  styleUrl: './qw-comment-footer.component.scss',
})
export class QwCommentFooterComponent {
  @Input() comment!: ForumComment;
  constructor(protected readonly self: QuestionWallService) {}
}
