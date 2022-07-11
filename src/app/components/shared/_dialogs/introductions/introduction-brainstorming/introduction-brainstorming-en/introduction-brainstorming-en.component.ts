import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-brainstorming-en',
  templateUrl: './introduction-brainstorming-en.component.html',
  styleUrls: ['./introduction-brainstorming-en.component.scss']
})
export class IntroductionBrainstormingENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
