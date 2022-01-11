import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-comment-list-de',
  templateUrl: './introduction-comment-list-de.component.html',
  styleUrls: ['./introduction-comment-list-de.component.scss']
})
export class IntroductionCommentListDEComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
