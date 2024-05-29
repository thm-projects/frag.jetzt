import { Component, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { QuestionWallService } from '../../question-wall.service';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';

@Component({
  selector: 'app-question-wall-comment-focus',
  standalone: true,
  imports: [ArsModule, MatButton, MatIcon, CustomMarkdownModule],
  templateUrl: './question-wall-comment-focus.component.html',
  styleUrl: './question-wall-comment-focus.component.scss',
})
export class QuestionWallCommentFocusComponent {
  @Input() comment!: ForumComment;
  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
  ) {}
}
