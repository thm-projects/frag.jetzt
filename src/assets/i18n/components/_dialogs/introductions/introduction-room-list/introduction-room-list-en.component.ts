import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-room-list-en',
  templateUrl: './introduction-room-list-en.component.html',
  styleUrls: ['./introduction-room-list-en.component.scss']
})
export class IntroductionRoomListENComponent implements OnInit {

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
