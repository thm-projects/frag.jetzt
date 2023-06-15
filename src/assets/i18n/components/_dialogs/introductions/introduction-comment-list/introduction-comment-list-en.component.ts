import { Component } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-comment-list-en',
  templateUrl: './introduction-comment-list-en.component.html',
  styleUrls: ['./introduction-comment-list-en.component.scss'],
})
export class IntroductionCommentListENComponent {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}
}
