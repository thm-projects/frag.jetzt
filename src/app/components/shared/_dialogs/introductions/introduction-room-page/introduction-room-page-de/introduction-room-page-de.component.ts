import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-room-page-de',
  templateUrl: './introduction-room-page-de.component.html',
  styleUrls: ['./introduction-room-page-de.component.scss']
})
export class IntroductionRoomPageDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}