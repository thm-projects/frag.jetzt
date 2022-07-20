import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-introduction-brainstorming-fr',
  templateUrl: './introduction-brainstorming-fr.component.html',
  styleUrls: ['./introduction-brainstorming-fr.component.scss']
})
export class IntroductionBrainstormingFRComponent implements OnInit {

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
