import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { RoomService } from '../../../../services/http/room.service';
import { BonusToken } from '../../../../models/bonus-token';
import { BonusTokenRoomMixin } from '../../../../models/bonus-token-room-mixin';
import { MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-bonus-token',
  templateUrl: './user-bonus-token.component.html',
  styleUrls: ['./user-bonus-token.component.scss']
})
export class UserBonusTokenComponent implements OnInit {
  userId: string;
  bonusTokens: BonusToken[] = [];
  bonusTokensMixin: BonusTokenRoomMixin[] = [];

  constructor(
    private bonusTokenService: BonusTokenService,
    private roomService: RoomService,
    private dialogRef: MatDialogRef<UserBonusTokenComponent>,
    protected router: Router
  ) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByUserId(this.userId).subscribe( list => {
      this.bonusTokens = list.sort((a, b) => {
        return (a.token > b.token) ? 1 : -1;
      });
      for (const bt of this.bonusTokens) {
        this.roomService.getRoom(bt.roomId).subscribe(room => {
          const btm = <BonusTokenRoomMixin> bt;
          btm.roomShortId = room.shortId;
          btm.roomName = room.name;
          this.bonusTokensMixin.push(btm);
        });
      }
    });
  }

  navToComment(index: number) {
    this.dialogRef.close();
    const commentURL = `participant/room/${this.bonusTokensMixin[index].roomShortId}/comment/${this.bonusTokens[index].commentId}`;
    this.router.navigate([commentURL]);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
