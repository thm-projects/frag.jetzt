import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-brainstorming-en',
  templateUrl: './introduction-brainstorming-en.component.html',
  styleUrls: ['./introduction-brainstorming-en.component.scss'],
  standalone: false,
})
export class IntroductionBrainstormingENComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
