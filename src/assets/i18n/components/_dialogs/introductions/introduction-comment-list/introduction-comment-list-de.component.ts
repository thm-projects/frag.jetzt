import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-comment-list-de',
  templateUrl: './introduction-comment-list-de.component.html',
  styleUrls: ['./introduction-comment-list-de.component.scss'],
  standalone: false,
})
export class IntroductionCommentListDEComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
