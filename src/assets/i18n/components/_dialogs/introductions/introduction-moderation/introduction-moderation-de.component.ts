import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-moderation-de',
  templateUrl: './introduction-moderation-de.component.html',
  styleUrls: ['./introduction-moderation-de.component.scss'],
  standalone: false,
})
export class IntroductionModerationDEComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
