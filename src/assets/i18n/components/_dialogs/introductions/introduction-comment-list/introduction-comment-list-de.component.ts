import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-comment-list-de',
  templateUrl: './introduction-comment-list-de.component.html',
  styleUrls: ['./introduction-comment-list-de.component.scss']
})
export class IntroductionCommentListDEComponent implements OnInit {

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
