import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-room-page-de',
  templateUrl: './introduction-room-page-de.component.html',
  styleUrls: ['./introduction-room-page-de.component.scss'],
  standalone: false,
})
export class IntroductionRoomPageDEComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
