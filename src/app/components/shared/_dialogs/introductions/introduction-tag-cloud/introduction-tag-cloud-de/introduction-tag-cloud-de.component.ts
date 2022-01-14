import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-tag-cloud-de',
  templateUrl: './introduction-tag-cloud-de.component.html',
  styleUrls: ['./introduction-tag-cloud-de.component.scss']
})
export class IntroductionTagCloudDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
