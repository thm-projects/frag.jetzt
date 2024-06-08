import { Component, HostListener, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardFooter,
    MatCardTitle,
    ArsModule,
    MatIcon,
    MatButton,
    CustomMarkdownModule,
  ],
  templateUrl: './qw-comment.component.html',
  styleUrl: './qw-comment.component.scss',
})
export class QwCommentComponent {
  @Input() context!: {
    session: QuestionWallSession;
    comment: ForumComment;
  };

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
  ) {}

  @HostListener('click') _click() {
    if (this.self.session.focus.value?.id !== this.context.comment.id) {
      this.self.session.focus.next(this.context.comment);
    }
  }
}
