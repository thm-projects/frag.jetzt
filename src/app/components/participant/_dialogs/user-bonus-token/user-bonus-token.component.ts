import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { RoomService } from '../../../../services/http/room.service';
import { BonusToken } from '../../../../models/bonus-token';
import { BonusTokenRoomMixin } from '../../../../models/bonus-token-room-mixin';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatOptionSelectionChange } from '@angular/material/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';

export class MinRoom {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

@Component({
  selector: 'app-user-bonus-token',
  templateUrl: './user-bonus-token.component.html',
  styleUrls: ['./user-bonus-token.component.scss']
})
export class UserBonusTokenComponent implements OnInit {
  userId: string;
  bonusTokens: BonusToken[] = [];
  bonusTokensMixin: BonusTokenRoomMixin[] = [];
  currentRoom: MinRoom;
  rooms: MinRoom[] = [];

  constructor(
    private bonusTokenService: BonusTokenService,
    private roomService: RoomService,
    private dialogRef: MatDialogRef<UserBonusTokenComponent>,
    protected router: Router,
    private translationService: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit() {
    this.bonusTokenService.getTokensByUserId(this.userId).subscribe(list => {
      list.sort((a, b) => (a.token > b.token) ? 1 : -1);
      this.bonusTokens = list;
      for (const bt of this.bonusTokens) {
        this.roomService.getRoom(bt.roomId).subscribe(room => {
          const btm = bt as BonusTokenRoomMixin;
          btm.roomShortId = room.shortId;
          btm.roomName = room.name;
          this.bonusTokensMixin.push(btm);
          if (!this.rooms.some(r => r.id === room.shortId)) {
            this.rooms.push(new MinRoom(room.name, room.shortId));
          }
        });
      }
    });
  }

  navToComment(index: number) {
    this.dialogRef.close();
    const commentURL = `participant/room/${this.bonusTokensMixin[index].roomShortId}/comment/${this.bonusTokens[index].commentId}`;
    this.router.navigate([commentURL]);
  }

  getTokensByRoom(shortId: string): string {
    let tokens = '';
    for (const bt of this.bonusTokensMixin) {
      if (bt.roomShortId === shortId) {
        tokens += bt.token + '%0D%0A%0D%0A';
      }
    }
    return tokens;
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.user-bonus';
  }

  setCurrentRoom(event: MatOptionSelectionChange, room: MinRoom) {
    if (event.source.selected) {
      this.currentRoom = room;
    }
  }

  openMail() {
    if (this.currentRoom) {
      const sessionName = this.currentRoom.name;
      const sessionId = this.currentRoom.id;
      const translationList = ['user-bonus-token.mail-subject', 'user-bonus-token.mail-body-1', 'user-bonus-token.mail-body-2',
        'user-bonus-token.mail-body-3', 'user-bonus-token.mail-body-4'];
      let mailText: string;
      this.translationService.get(translationList).subscribe(msgs => {
        mailText = 'mailto:?subject=' + msgs[translationList[0]] + sessionName + '%C2%AB&body=' + msgs[translationList[1]] + sessionName
          + msgs[translationList[2]] + sessionId + msgs[translationList[3]] + this.getTokensByRoom(sessionId) + msgs[translationList[4]];
        window.location.href = mailText;
      });
    } else {
      this.translationService.get('user-bonus-token.please-choose').subscribe(msg => {
        this.notificationService.show(msg);
      });
    }
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
