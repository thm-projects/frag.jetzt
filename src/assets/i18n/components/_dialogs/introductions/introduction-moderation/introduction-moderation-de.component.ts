import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-moderation-de',
  templateUrl: './introduction-moderation-de.component.html',
  styleUrls: ['./introduction-moderation-de.component.scss']
})
export class IntroductionModerationDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
