import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-room-list-fr',
  templateUrl: './introduction-room-list-fr.component.html',
  styleUrls: ['./introduction-room-list-fr.component.scss']
})
export class IntroductionRoomListFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
