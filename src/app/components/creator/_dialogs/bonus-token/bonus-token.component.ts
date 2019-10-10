import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit {
  roomId: string;
  bonusTokens: BonusToken[] = [];

  constructor(private bonusTokenService: BonusTokenService,
              private dialogRef: MatDialogRef<BonusTokenComponent>) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.roomId).subscribe( list => {
      this.bonusTokens = list;
    });
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
