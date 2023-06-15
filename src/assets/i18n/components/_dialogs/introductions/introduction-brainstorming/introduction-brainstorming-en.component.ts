import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-brainstorming-en',
  templateUrl: './introduction-brainstorming-en.component.html',
  styleUrls: ['./introduction-brainstorming-en.component.scss'],
})
export class IntroductionBrainstormingENComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
