import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-questioner-background',
  standalone: true,
  imports: [],
  templateUrl: './qw-comment-questioner-background.component.html',
  styleUrl: './qw-comment-questioner-background.component.scss',
})
export class QwCommentQuestionerBackgroundComponent {
  @Input() value: string;
}
