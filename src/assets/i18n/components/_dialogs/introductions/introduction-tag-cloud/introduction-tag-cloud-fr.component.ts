import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-tag-cloud-fr',
  templateUrl: './introduction-tag-cloud-fr.component.html',
  styleUrls: ['./introduction-tag-cloud-fr.component.scss']
})
export class IntroductionTagCloudFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
