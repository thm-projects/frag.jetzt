import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-comment-list',
  templateUrl: './introduction-comment-list.component.html',
  styleUrls: ['./introduction-comment-list.component.scss'],
  standalone: false,
})
export class IntroductionCommentListComponent {
  protected readonly language = language;
}
