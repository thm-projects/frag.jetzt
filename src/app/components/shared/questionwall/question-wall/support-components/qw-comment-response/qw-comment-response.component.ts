import { Component, Input } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { QwCommentFooterComponent } from '../qw-comment-footer/qw-comment-footer.component';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-response',
  standalone: true,
  imports: [
    ArsModule,
    CustomMarkdownModule,
    MatButton,
    MatIcon,
    NgIf,
    QwCommentFooterComponent,
  ],
  templateUrl: './qw-comment-response.component.html',
  styleUrl: './qw-comment-response.component.scss',
})
export class QwCommentResponseComponent {
  @Input() comment: ForumComment;
  answersExpanded: boolean;
  constructor(public readonly dateFormatter: ArsDateFormatter) {}
}
