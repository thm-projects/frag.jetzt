import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { CachedSanitizerService } from '../../../../../../app/services/util/cached-sanitizer.service';

@Component({
  selector: 'app-introduction-comment-list-fr',
  templateUrl: './introduction-comment-list-fr.component.html',
  styleUrls: ['./introduction-comment-list-fr.component.scss'],
  standalone: false,
})
export class IntroductionCommentListFRComponent implements OnInit {
  constructor(
    public sessionInfo: SessionService,
    public sanitizer: CachedSanitizerService,
  ) {}

  ngOnInit(): void {}
}
