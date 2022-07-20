import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-question-wall-fr',
  templateUrl: './introduction-question-wall-fr.component.html',
  styleUrls: ['./introduction-question-wall-fr.component.scss']
})
export class IntroductionQuestionWallFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {
  }

  ngOnInit(): void {
  }

}
