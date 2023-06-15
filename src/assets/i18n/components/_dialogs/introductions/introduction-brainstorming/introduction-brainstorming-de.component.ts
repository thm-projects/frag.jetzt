import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-brainstorming-de',
  templateUrl: './introduction-brainstorming-de.component.html',
  styleUrls: ['./introduction-brainstorming-de.component.scss'],
})
export class IntroductionBrainstormingDEComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
