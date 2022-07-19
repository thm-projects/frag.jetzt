import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-question-wall-de',
  templateUrl: './introduction-question-wall-de.component.html',
  styleUrls: ['./introduction-question-wall-de.component.scss']
})
export class IntroductionQuestionWallDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
