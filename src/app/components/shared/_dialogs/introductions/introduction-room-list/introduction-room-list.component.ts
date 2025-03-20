import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-introduction-room-list',
  templateUrl: './introduction-room-list.component.html',
  styleUrls: ['./introduction-room-list.component.scss'],
  standalone: false,
})
export class IntroductionRoomListComponent {
  protected readonly language = language;
}
