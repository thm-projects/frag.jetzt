import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatChip } from '@angular/material/chips';
import { QuestionWallCommentContext } from '../question-wall-drawer/question-wall-drawer-comment/question-wall-drawer-comment.component';

@Component({
  selector: 'app-question-wall-comment-options',
  standalone: true,
  imports: [MatButton, MatIcon, NgIf, MatChip],
  templateUrl: './question-wall-comment-options.component.html',
})
export class QuestionWallCommentOptionsComponent {
  @Input() data: QuestionWallCommentContext | undefined;
}
