import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-tag-cloud-fr',
  templateUrl: './introduction-tag-cloud-fr.component.html',
  styleUrls: ['./introduction-tag-cloud-fr.component.scss'],
})
export class IntroductionTagCloudFRComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
