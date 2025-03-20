import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-question-wall',
  templateUrl: './introduction-question-wall.component.html',
  styleUrls: ['./introduction-question-wall.component.scss'],
  standalone: false,
})
export class IntroductionQuestionWallComponent {
  protected readonly language = language;
}
