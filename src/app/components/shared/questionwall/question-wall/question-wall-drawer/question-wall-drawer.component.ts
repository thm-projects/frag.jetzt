import { Component, Input } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import {
  QuestionWallContext,
  QuestionWallDrawerCommentComponent,
} from './question-wall-drawer-comment/question-wall-drawer-comment.component';
import { ForumComment } from '../../../../../utils/data-accessor';

export interface QuestionWallDrawerContext extends QuestionWallContext {
  comments: ForumComment[];
}

@Component({
  selector: 'app-question-wall-drawer',
  standalone: true,
  imports: [NgForOf, QuestionWallDrawerCommentComponent, NgIf],
  templateUrl: './question-wall-drawer.component.html',
  styleUrl: './question-wall-drawer.component.scss',
})
export class QuestionWallDrawerComponent {
  @Input() data: QuestionWallDrawerContext | undefined;
}
