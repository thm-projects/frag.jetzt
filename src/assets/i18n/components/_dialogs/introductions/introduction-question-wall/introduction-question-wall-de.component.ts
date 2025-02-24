import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-question-wall-de',
  templateUrl: './introduction-question-wall-de.component.html',
  styleUrls: ['./introduction-question-wall-de.component.scss'],
  standalone: false,
})
export class IntroductionQuestionWallDEComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
