import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-room-page-de',
  templateUrl: './introduction-room-page-de.component.html',
  styleUrls: ['./introduction-room-page-de.component.scss']
})
export class IntroductionRoomPageDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
    private domSanitizer: DomSanitizer,
  ) {
  }

  trust(url: string) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
  }

}
