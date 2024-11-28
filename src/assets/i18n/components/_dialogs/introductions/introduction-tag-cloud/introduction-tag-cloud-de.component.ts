import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-tag-cloud-de',
  templateUrl: './introduction-tag-cloud-de.component.html',
  styleUrls: ['./introduction-tag-cloud-de.component.scss'],
  standalone: false,
})
export class IntroductionTagCloudDEComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
