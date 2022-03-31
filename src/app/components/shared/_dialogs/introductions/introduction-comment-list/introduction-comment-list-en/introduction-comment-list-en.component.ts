import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../../../../../services/util/session.service';

@Component({
  selector: 'app-introduction-comment-list-en',
  templateUrl: './introduction-comment-list-en.component.html',
  styleUrls: ['./introduction-comment-list-en.component.scss']
})
export class IntroductionCommentListENComponent implements OnInit {

  constructor(
    public sessionInfo: SessionService,
  ) {
  }

  ngOnInit(): void {
  }

}
