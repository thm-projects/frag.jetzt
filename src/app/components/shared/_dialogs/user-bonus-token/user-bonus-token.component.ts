import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';

@Component({
  selector: 'app-user-bonus-token',
  templateUrl: './user-bonus-token.component.html',
  styleUrls: ['./user-bonus-token.component.scss']
})
export class UserBonusTokenComponent implements OnInit {
  userId: string;
  bonusTokens: BonusToken[] = [];

  constructor(
    private bonusTokenService: BonusTokenService
  ) {

  }

  ngOnInit() {
    this.bonusTokenService.getTokensByUserId(this.userId).subscribe( list => {
      this.bonusTokens = list;
    });
  }
}
