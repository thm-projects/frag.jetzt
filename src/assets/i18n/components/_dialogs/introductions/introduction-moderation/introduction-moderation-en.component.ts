import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-moderation-en',
  templateUrl: './introduction-moderation-en.component.html',
  styleUrls: ['./introduction-moderation-en.component.scss'],
})
export class IntroductionModerationENComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
