import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-room-page',
  templateUrl: './introduction-room-page.component.html',
  styleUrls: ['./introduction-room-page.component.scss'],
  standalone: false,
})
export class IntroductionRoomPageComponent {
  protected readonly language = language;
}
