import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-tag-cloud-en',
  templateUrl: './introduction-tag-cloud-en.component.html',
  styleUrls: ['./introduction-tag-cloud-en.component.scss']
})
export class IntroductionTagCloudENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
