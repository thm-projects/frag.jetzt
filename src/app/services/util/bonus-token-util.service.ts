import { Injectable } from '@angular/core';
import { CommentService } from '../http/comment.service';
import { BonusTokenService } from '../http/bonus-token.service';
import { BonusToken } from '../../models/bonus-token';

@Injectable({
  providedIn: 'root'
})
export class BonusTokenUtilService {

  constructor(
    private commentService: CommentService,
    private bonusTokenService: BonusTokenService
  ) {
  }

  setQuestionNumber(bts: BonusToken[]): BonusToken[] {
    bts.forEach(bt => {
      this.commentService.getComment(bt.commentId).subscribe(comment => {
        bt.questionNumber = comment.number;
      });
    });
    return bts;
  }
}

