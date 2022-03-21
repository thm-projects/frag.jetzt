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
import { Clipboard } from '@angular/cdk/clipboard';
import { CommentService } from '../../../../services/http/comment.service';
import { LanguageService } from '../../../../services/util/language.service';
import { BonusTokenUtilService } from '../../../../services/util/bonus-token-util.service';
import { numberSorter } from '../../../../models/comment';

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
  lang: string;

  constructor(
    private bonusTokenService: BonusTokenService,
    private roomService: RoomService,
    private commentService: CommentService,
    private translateService: TranslateService,
    private langService: LanguageService,
    private dialogRef: MatDialogRef<UserBonusTokenComponent>,
    private bonusTokenUtilService: BonusTokenUtilService,
    private moderatorService: ModeratorService,
    protected router: Router,
    private translationService: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private clipboard: Clipboard
  ) {
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  private static escapeForEmail(text: string): string {
    return encodeURIComponent(text.replace(/(\r\n)|\n/gm, '\r\n'));
  }

  ngOnInit() {
    this.lang = this.translateService.currentLang;
    this.bonusTokenService.getTokensByUserId(this.userId).subscribe(list => {
      list.sort((a, b) => (a.token > b.token) ? 1 : -1);
      this.bonusTokens = list;
      this.bonusTokens = this.bonusTokenUtilService.setQuestionNumber(this.bonusTokens);
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

  redeemStars(useEmail: boolean) {
    if (!this.currentRoom) {
      if (this.rooms.length === 1 && this.rooms[0]) {
        this.currentRoom = this.rooms[0];
      } else {
        this.translationService.get('user-bonus-token.please-choose').subscribe(msg => {
          this.notificationService.show(msg);
        });
        return;
      }
    }

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
                    return users.map((user) => (user as any).email as string).filter(e => e);
                  })
                );
            })
          ))
      )
      .subscribe(ids => {
        if (useEmail) {
          this.redeemEmail(ids[0] || '', ids.slice(1));
        } else {
          this.redeemClipboard(ids[0] || '', ids.slice(1));
        }
      });
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  private redeemClipboard(ownerEmail: string, moderatorEmails: string[]) {
    const sessionName = this.currentRoom.name;
    const sessionId = this.currentRoom.id;
    const translationList = [
      'user-bonus-token.session-name', 'user-bonus-token.session-id', 'user-bonus-token.owner-email',
      'user-bonus-token.moderator-emails', 'user-bonus-token.bonus-tokens', 'user-bonus-token.bonus-token-body1',
      'user-bonus-token.bonus-token-body2', 'user-bonus-token.email-not-set',
      'user-bonus-token.redeem-clipboard-success', 'user-bonus-token.redeem-clipboard-failure'
    ];
    let clipBoardText: string;
    this.translationService.get(translationList).subscribe(msgs => {
      ownerEmail = (ownerEmail === '' ? msgs[translationList[7]] : '\n' + ownerEmail);
      clipBoardText = msgs[translationList[0]] + ': ' + sessionName + msgs[translationList[1]] + ': ' +
        sessionId + msgs[translationList[2]] + ': ' + ownerEmail + msgs[translationList[3]] + ': ' +
        (moderatorEmails[0] === undefined ? msgs[translationList[7]] : moderatorEmails.map(e => '\n' + e)) +
        msgs[translationList[4]] + ': ';
      this.bonusTokensMixin
        .filter(btm => btm.roomShortId === this.currentRoom.id)
        .filter(btm => btm.accountId === this.userId)
        .sort((a, b) => numberSorter(a.questionNumber, b.questionNumber))
        .forEach(btm => {
          const date = new Date(btm.createdAt);
          clipBoardText += '\n' + btm.token + msgs[translationList[5]] + date.toLocaleDateString(this.lang) +
            msgs[translationList[6]] + btm.questionNumber;
          this.clipboard.copy(clipBoardText);
        });
      this.notificationService.show(msgs[translationList[8]]);
    });
  }

  private redeemEmail(ownerEmail: string, moderatorEmails: string[]) {
    const sessionName = this.currentRoom.name;
    const sessionId = this.currentRoom.id;
    const translationList = [
      'user-bonus-token.mail-subject', 'user-bonus-token.mail-body1', 'user-bonus-token.mail-body2',
      'user-bonus-token.bonus-token-body1', 'user-bonus-token.bonus-token-body2', 'user-bonus-token.email-not-set',
      'user-bonus-token.redeem-mail-success'
    ];
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
      tokens: this.bonusTokens
    }).subscribe(msgs => {
      ownerEmail = (ownerEmail === '' ? msgs[translationList[5]] : ownerEmail);
      mailText = 'mailto:' + UserBonusTokenComponent.escapeForEmail(ownerEmail) + '?' +
        'subject=' + UserBonusTokenComponent.escapeForEmail(msgs[translationList[0]]) + '&' +
        (escapedModeratorEmails.length > 0 ? 'cc=' + escapedModeratorEmails + '&' : '') +
        'body=' + UserBonusTokenComponent.escapeForEmail(msgs[translationList[1]]) +
        this.bonusTokensMixin
          .filter(btm => btm.roomShortId === this.currentRoom.id)
          .filter(btm => btm.accountId === this.userId)
          .sort((a, b) => numberSorter(a.questionNumber, b.questionNumber))
          .map(btm => {
            const date = new Date(btm.createdAt);
            return UserBonusTokenComponent.escapeForEmail('\n\n' + btm.token + msgs[translationList[3]] +
              date.toLocaleDateString(this.lang) + msgs[translationList[4]] + btm.questionNumber);
          }) +
        UserBonusTokenComponent.escapeForEmail(msgs[translationList[2]]);
      if (window.open(mailText, '_self') === null) {
        this.notificationService.show(msgs[translationList[6]]);
      }
    });
  }
}
