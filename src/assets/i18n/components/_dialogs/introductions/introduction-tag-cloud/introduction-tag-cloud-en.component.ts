import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-tag-cloud-en',
  templateUrl: './introduction-tag-cloud-en.component.html',
  styleUrls: ['./introduction-tag-cloud-en.component.scss']
})
export class IntroductionTagCloudENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {
  }

  ngOnInit(): void {
  }

}
