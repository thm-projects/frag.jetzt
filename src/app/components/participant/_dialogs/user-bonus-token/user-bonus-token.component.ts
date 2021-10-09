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
import { ModeratorService } from '../../../../services/http/moderator.service';
import { map, switchMap } from 'rxjs/operators';

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
    private moderatorService: ModeratorService,
    protected router: Router,
    private translationService: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {
  }

  private static escapeForEmail(text: string): string {
    return encodeURIComponent(text.replace(/(\r\n)|\n/gm, '\r\n'));
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
    return this.bonusTokensMixin.filter(bt => bt.roomShortId === shortId).map(bt => bt.token).join('\n\n');
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
      this.roomService.getRoomByShortId(this.currentRoom.id)
        .pipe(
          switchMap((room) => this.moderatorService.get(room.id)
            .pipe(
              switchMap((moderators) => {
                const moderatorIds = moderators.map((moderator) => moderator.accountId);
                const userIds = [room.ownerId, ...moderatorIds];
                return this.moderatorService.getUserData(userIds)
                  .pipe(
                    map((users) => {
                      users.sort((a, b) => userIds.indexOf(a.id) - userIds.indexOf(b.id));
                      return users.map((user) => (user as any).email as string);
                    })
                  );
              })
            ))
        )
        .subscribe(ids => {
          this.send(ids.find(e => e) || 'null', ids.slice(1).filter(e => e));
        });
    } else {
      this.translationService.get('user-bonus-token.please-choose').subscribe(msg => {
        this.notificationService.show(msg);
      });
    }
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  private send(ownerEmail: string, moderatorEmails: string[]) {
    const sessionName = this.currentRoom.name;
    const sessionId = this.currentRoom.id;
    const translationList = ['user-bonus-token.mail-subject', 'user-bonus-token.mail-body'];
    const escapedModeratorEmails = moderatorEmails.reduce((acc, value) => {
      if (acc.length > 0) {
        return acc + ',' + UserBonusTokenComponent.escapeForEmail(value);
      } else {
        return UserBonusTokenComponent.escapeForEmail(value);
      }
    }, '');
    let mailText: string;
    this.translationService.get(translationList, {
      sessionName,
      sessionId,
      tokens: this.getTokensByRoom(sessionId)
    }).subscribe(msgs => {
      mailText = 'mailto:' + UserBonusTokenComponent.escapeForEmail(ownerEmail) + '?' +
        'subject=' + UserBonusTokenComponent.escapeForEmail(msgs[translationList[0]]) + '&' +
        (escapedModeratorEmails.length > 0 ? 'cc=' + escapedModeratorEmails + '&' : '') +
        'body=' + UserBonusTokenComponent.escapeForEmail(msgs[translationList[1]]);
      window.location.href = mailText;
    });
  }
}
