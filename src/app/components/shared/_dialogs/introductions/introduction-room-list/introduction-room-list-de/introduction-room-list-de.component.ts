import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-room-list-de',
  templateUrl: './introduction-room-list-de.component.html',
  styleUrls: ['./introduction-room-list-de.component.scss']
})
export class IntroductionRoomListDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
