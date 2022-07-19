import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-question-wall-fr',
  templateUrl: './introduction-question-wall-fr.component.html',
  styleUrls: ['./introduction-question-wall-fr.component.scss']
})
export class IntroductionQuestionWallFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
