import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { QuestionWallService } from '../../question-wall.service';
import { UIComment } from 'app/room/state/comment-updates';

@Component({
  selector: 'qw-comment-footer',
  imports: [MatButton, MatIcon],
  templateUrl: './qw-comment-footer.component.html',
  styleUrl: './qw-comment-footer.component.scss',
})
export class QwCommentFooterComponent {
  @Input() comment!: UIComment;
  constructor(protected readonly self: QuestionWallService) {}
}
