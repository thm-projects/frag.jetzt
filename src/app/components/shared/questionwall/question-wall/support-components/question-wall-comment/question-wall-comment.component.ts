import { Component, HostListener, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { QuestionWallService } from '../../question-wall.service';
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

@Component({
  selector: 'app-question-wall-comment',
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
  ],
  templateUrl: './question-wall-comment.component.html',
  styleUrl: './question-wall-comment.component.scss',
})
export class QuestionWallCommentComponent {
  @Input() comment!: ForumComment;

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
  ) {}

  @HostListener('click') _click() {
    if (this.self.focus.value?.id !== this.comment.id) {
      this.self.focus.next(this.comment);
    }
  }
}
