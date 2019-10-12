import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { BonusToken } from '../../../../models/bonus-token';
import { MatDialog, MatDialogRef } from '@angular/material';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { BonusDeleteComponent } from '../bonus-delete/bonus-delete.component';

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss']
})
export class BonusTokenComponent implements OnInit {
  roomId: string;
  bonusTokens: BonusToken[] = [];

  constructor(private bonusTokenService: BonusTokenService,
              public dialog: MatDialog,
              private dialogRef: MatDialogRef<RoomCreatorPageComponent>) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByRoomId(this.roomId).subscribe( list => {
      this.bonusTokens = list;
    });
  }

  openDeleteSingleBonusDialog(userId: string, commentId: string): void {
    const dialogRef = this.dialog.open(BonusDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.multipleBonuses = false;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteBonus(userId, commentId);
        }
      });
  }

  deleteBonus(userId: string, commentId: string): void {
    // Delete bonus via bonus-token-service
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
