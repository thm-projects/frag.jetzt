import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-room-page-en',
  templateUrl: './introduction-room-page-en.component.html',
  styleUrls: ['./introduction-room-page-en.component.scss']
})
export class IntroductionRoomPageENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
