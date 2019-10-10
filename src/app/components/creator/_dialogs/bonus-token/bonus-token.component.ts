import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit {
  roomId: string;
  bonusTokens: BonusToken[] = [];

  constructor(
    private bonusTokenService: BonusTokenService
  ) {

  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.roomId).subscribe( list => {
      this.bonusTokens = list;
    });
  }
}
