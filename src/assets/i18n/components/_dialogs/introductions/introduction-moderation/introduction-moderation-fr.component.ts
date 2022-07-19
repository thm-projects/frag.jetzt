import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-moderation-fr',
  templateUrl: './introduction-moderation-fr.component.html',
  styleUrls: ['./introduction-moderation-fr.component.scss']
})
export class IntroductionModerationFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
