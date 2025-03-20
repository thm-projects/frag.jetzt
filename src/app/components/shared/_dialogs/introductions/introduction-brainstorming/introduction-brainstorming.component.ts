import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-brainstorming',
  templateUrl: './introduction-brainstorming.component.html',
  styleUrls: ['./introduction-brainstorming.component.scss'],
  standalone: false,
})
export class IntroductionBrainstormingComponent {
  protected readonly language = language;
}
