import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-moderation-fr',
  templateUrl: './introduction-moderation-fr.component.html',
  styleUrls: ['./introduction-moderation-fr.component.scss'],
})
export class IntroductionModerationFRComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
