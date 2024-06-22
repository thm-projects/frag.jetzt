import { Component, Input } from '@angular/core';
import { QwCommentResponseComponent } from '../qw-comment-response/qw-comment-response.component';
import { ForumComment } from '../../../../../../utils/data-accessor';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-response-window',
  standalone: true,
  imports: [QwCommentResponseComponent],
  templateUrl: './qw-comment-response-window.component.html',
  styleUrl: './qw-comment-response-window.component.scss',
})
export class QwCommentResponseWindowComponent {
  @Input() replies: ForumComment[];
}
