import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-question-wall-en',
  templateUrl: './introduction-question-wall-en.component.html',
  styleUrls: ['./introduction-question-wall-en.component.scss'],
})
export class IntroductionQuestionWallENComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
