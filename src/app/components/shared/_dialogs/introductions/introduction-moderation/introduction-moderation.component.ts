import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-moderation',
  templateUrl: './introduction-moderation.component.html',
  styleUrls: ['./introduction-moderation.component.scss'],
  standalone: false,
})
export class IntroductionModerationComponent {
  protected readonly language = language;
}
