import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-room-page-fr',
  templateUrl: './introduction-room-page-fr.component.html',
  styleUrls: ['./introduction-room-page-fr.component.scss']
})
export class IntroductionRoomPageFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}