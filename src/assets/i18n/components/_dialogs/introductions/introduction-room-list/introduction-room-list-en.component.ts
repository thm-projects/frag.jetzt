import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-room-list-en',
  templateUrl: './introduction-room-list-en.component.html',
  styleUrls: ['./introduction-room-list-en.component.scss'],
  standalone: false,
})
export class IntroductionRoomListENComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
