import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-room-list-fr',
  templateUrl: './introduction-room-list-fr.component.html',
  styleUrls: ['./introduction-room-list-fr.component.scss']
})
export class IntroductionRoomListFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {
  }

  ngOnInit(): void {
  }

}
