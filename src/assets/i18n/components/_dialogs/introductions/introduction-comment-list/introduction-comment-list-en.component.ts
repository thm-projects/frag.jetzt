import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-comment-list-en',
  templateUrl: './introduction-comment-list-en.component.html',
  styleUrls: ['./introduction-comment-list-en.component.scss']
})
export class IntroductionCommentListENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
    private domSanitizer: DomSanitizer,
  ) {
  }

  trust(url: string) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }


  ngOnInit(): void {
  }

}
