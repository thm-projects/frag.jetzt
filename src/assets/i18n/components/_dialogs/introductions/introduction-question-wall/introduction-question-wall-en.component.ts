import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-question-wall-en',
  templateUrl: './introduction-question-wall-en.component.html',
  styleUrls: ['./introduction-question-wall-en.component.scss']
})
export class IntroductionQuestionWallENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
