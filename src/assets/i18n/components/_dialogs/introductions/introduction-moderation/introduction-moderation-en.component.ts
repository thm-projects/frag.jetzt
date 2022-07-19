import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-moderation-en',
  templateUrl: './introduction-moderation-en.component.html',
  styleUrls: ['./introduction-moderation-en.component.scss']
})
export class IntroductionModerationENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
