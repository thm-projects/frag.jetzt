import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../app/services/util/session.service';

@Component({
  selector: 'app-introduction-comment-list-fr',
  templateUrl: './introduction-comment-list-fr.component.html',
  styleUrls: ['./introduction-comment-list-fr.component.scss']
})
export class IntroductionCommentListFRComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
