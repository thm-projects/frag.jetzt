import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-brainstorming-de',
  templateUrl: './introduction-brainstorming-de.component.html',
  styleUrls: ['./introduction-brainstorming-de.component.scss']
})
export class IntroductionBrainstormingDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
