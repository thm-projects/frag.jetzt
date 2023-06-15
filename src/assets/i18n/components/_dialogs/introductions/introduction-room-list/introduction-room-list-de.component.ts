import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-room-list-de',
  templateUrl: './introduction-room-list-de.component.html',
  styleUrls: ['./introduction-room-list-de.component.scss'],
})
export class IntroductionRoomListDEComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
