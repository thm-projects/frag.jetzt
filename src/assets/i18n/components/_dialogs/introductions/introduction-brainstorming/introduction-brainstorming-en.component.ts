import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-brainstorming-en',
  templateUrl: './introduction-brainstorming-en.component.html',
  styleUrls: ['./introduction-brainstorming-en.component.scss']
})
export class IntroductionBrainstormingENComponent implements OnInit {

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
