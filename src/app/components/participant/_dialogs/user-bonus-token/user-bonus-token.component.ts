import { Component, OnInit } from '@angular/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { RoomService } from '../../../../services/http/room.service';
import { BonusToken } from '../../../../models/bonus-token';
import { BonusTokenRoomMixin } from '../../../../models/bonus-token-room-mixin';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { map, switchMap } from 'rxjs/operators';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommentService } from '../../../../services/http/comment.service';
import { BonusTokenUtilService } from '../../../../services/util/bonus-token-util.service';
import { numberSorter } from '../../../../models/comment';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatOptionSelectionChange } from '@angular/material/core';

import i18nRaw from './user-bonus-token.i18n.json';
import { i18nContext } from 'app/base/i18n/i18n-context';
const i18n = I18nLoader.load(i18nRaw);

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
  styleUrls: ['./user-bonus-token.component.scss'],
  standalone: false,
})
export class UserBonusTokenComponent implements OnInit {
  userId: string;
  bonusTokens: BonusToken[] = [];
  bonusTokensMixin: BonusTokenRoomMixin[] = [];
  currentRoom: MinRoom;
  rooms: MinRoom[] = [];
  lang: string;
  protected readonly i18n = i18n;

  constructor(
    private bonusTokenService: BonusTokenService,
    private roomService: RoomService,
    private commentService: CommentService,
    private translateService: TranslateService,
    private dialogRef: MatDialogRef<UserBonusTokenComponent>,
    private bonusTokenUtilService: BonusTokenUtilService,
    private moderatorService: ModeratorService,
    protected router: Router,
    private translationService: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private clipboard: Clipboard,
  ) {}

  static openDialog(
    dialog: MatDialog,
    userId: string,
  ): MatDialogRef<UserBonusTokenComponent> {
    const dialogRef = dialog.open(UserBonusTokenComponent);
    dialogRef.componentInstance.userId = userId;
    return dialogRef;
  }

  private static escapeForEmail(text: string): string {
    return encodeURIComponent(text.replace(/(\r\n)|\n/gm, '\r\n'));
  }

  ngOnInit() {
    this.lang = this.translateService.currentLang;
    this.bonusTokenService.getTokensByUserId(this.userId).subscribe((list) => {
      list.sort((a, b) => (a.token > b.token ? 1 : -1));
      this.bonusTokens = list;
      this.bonusTokens = this.bonusTokenUtilService.setQuestionNumber(
        this.bonusTokens,
      );
      for (const bt of this.bonusTokens) {
        this.roomService.getRoom(bt.roomId).subscribe((room) => {
          const btm = bt as BonusTokenRoomMixin;
          btm.roomShortId = room.shortId;
          btm.roomName = room.name;
          this.bonusTokensMixin.push(btm);
          if (!this.rooms.some((r) => r.id === room.shortId)) {
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
      autoFocus: false,
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
        this.translationService.get(i18n().pleaseChoose).subscribe((msg) => {
          this.notificationService.show(msg);
        });
        return;
      }
    }

    this.roomService
      .getRoomByShortId(this.currentRoom.id)
      .pipe(
        switchMap((room) =>
          this.moderatorService.get(room.id).pipe(
            switchMap((moderators) => {
              const moderatorIds = moderators.map(
                (moderator) => moderator.accountId,
              );
              const userIds = [room.ownerId, ...moderatorIds];
              return this.moderatorService.getUserData(userIds).pipe(
                map((users) => {
                  users.sort(
                    (a, b) => userIds.indexOf(a.id) - userIds.indexOf(b.id),
                  );
                  return users
                    .map((user) => (user as unknown as { email: string }).email)
                    .filter((e) => e);
                }),
              );
            }),
          ),
        ),
      )
      .subscribe((ids) => {
        if (useEmail) {
          this.redeemEmail(ids[0] || '', ids.slice(1));
        } else {
          this.redeemClipboard(ids[0] || '', ids.slice(1));
        }
      });
  }

  private redeemClipboard(ownerEmail: string, moderatorEmails: string[]) {
    const sessionName = this.currentRoom.name;
    const sessionId = this.currentRoom.id;
    const translationList = [
      i18n().sessionName,
      i18n().sessionId,
      i18n().ownerEmail,
      i18n().moderatorEmails,
      i18n().bonusTokens,
      i18n().bonusTokenBody1,
      i18n().bonusTokenBody2,
      i18n().emailNotSet,
      i18n().redeemClipboardSuccess,
      i18n().redeemClipboardFailure,
    ];
    let clipBoardText: string;
    ownerEmail = ownerEmail === '' ? translationList[7] : '\n' + ownerEmail;
    clipBoardText =
      translationList[0] +
      ': ' +
      sessionName +
      translationList[1] +
      ': ' +
      sessionId +
      translationList[2] +
      ': ' +
      ownerEmail +
      translationList[3] +
      ': ' +
      (moderatorEmails[0] === undefined
        ? translationList[7]
        : moderatorEmails.map((e) => '\n' + e)) +
      translationList[4] +
      ': ';
    this.bonusTokensMixin
      .filter((btm) => btm.roomShortId === this.currentRoom.id)
      .filter((btm) => btm.accountId === this.userId)
      .sort((a, b) => numberSorter(a.questionNumber, b.questionNumber))
      .forEach((btm) => {
        const date = new Date(btm.createdAt);
        clipBoardText +=
          '\n' +
          btm.token +
          translationList[5] +
          date.toLocaleDateString(this.lang) +
          translationList[6] +
          btm.questionNumber;
        this.clipboard.copy(clipBoardText);
      });
    this.notificationService.show(translationList[8]);
  }

  private redeemEmail(ownerEmail: string, moderatorEmails: string[]) {
    const sessionName = this.currentRoom.name;
    const sessionId = this.currentRoom.id;
    const translationList = [
      i18nContext(i18n().mailSubject, { sessionName, sessionId }),
      i18n().mailBody1,
      i18nContext(i18n().mailBody2, { sessionName, sessionId }),
      i18n().bonusTokenBody1,
      i18n().bonusTokenBody2,
      i18n().emailNotSet,
      i18n().redeemMailSuccess,
    ];
    const escapedModeratorEmails = moderatorEmails.reduce((acc, value) => {
      if (acc.length > 0) {
        return acc + ',' + UserBonusTokenComponent.escapeForEmail(value);
      } else {
        return UserBonusTokenComponent.escapeForEmail(value);
      }
    }, '');
    ownerEmail = ownerEmail === '' ? translationList[5] : ownerEmail;
    const mailText: string =
      'mailto:' +
      UserBonusTokenComponent.escapeForEmail(ownerEmail) +
      '?' +
      'subject=' +
      UserBonusTokenComponent.escapeForEmail(translationList[0]) +
      '&' +
      (escapedModeratorEmails.length > 0
        ? 'cc=' + escapedModeratorEmails + '&'
        : '') +
      'body=' +
      UserBonusTokenComponent.escapeForEmail(translationList[1]) +
      this.bonusTokensMixin
        .filter((btm) => btm.roomShortId === this.currentRoom.id)
        .filter((btm) => btm.accountId === this.userId)
        .sort((a, b) => numberSorter(a.questionNumber, b.questionNumber))
        .map((btm) => {
          const date = new Date(btm.createdAt);
          return UserBonusTokenComponent.escapeForEmail(
            '\n\n' +
              btm.token +
              translationList[3] +
              date.toLocaleDateString(this.lang) +
              translationList[4] +
              btm.questionNumber,
          );
        }) +
      UserBonusTokenComponent.escapeForEmail(translationList[2]);
    if (window.open(mailText, '_self') === null) {
      this.notificationService.show(translationList[6]);
    }
  }
}
