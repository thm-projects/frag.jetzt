import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { CommentNotificationService } from '../../../../services/http/comment-notification.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { CommentNotification } from '../../../../models/comment-notification';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { user } from 'app/user/state/user';

enum WeekDay {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

@Component({
  selector: 'app-comment-notification-dialog',
  templateUrl: './comment-notification-dialog.component.html',
  styleUrls: ['./comment-notification-dialog.component.scss'],
  standalone: false,
})
export class CommentNotificationDialogComponent implements OnInit, OnDestroy {
  @Input() room: Room;
  date: Date;
  currentIndex = 0;
  isLoading = true;
  private notifications: [Date, string][] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  private lastSetting: string;
  private settingInactive: string;
  private _destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<CommentNotificationDialogComponent>,
    private translateService: TranslateService,
    private appState: AppStateService,
    private commentNotificationService: CommentNotificationService,
    private notificationService: NotificationService,
    private accountState: AccountStateService,
  ) {
    this.appState.language$.pipe(takeUntil(this._destroyer)).subscribe(() => {
      this.translateService
        .get('comment-notification.last-setting')
        .subscribe((text) => (this.lastSetting = text));
      this.translateService
        .get('comment-notification.setting-inactive')
        .subscribe((text) => (this.settingInactive = text));
    });
  }

  static openDialog(
    dialog: MatDialog,
    room: Room,
  ): MatDialogRef<CommentNotificationDialogComponent> {
    const dialogRef = dialog.open(CommentNotificationDialogComponent);
    dialogRef.componentInstance.room = room;
    return dialogRef;
  }

  private static notificationSettingToDate(notificationSetting: number): Date {
    const weekDay = notificationSetting >> 11;
    const minutes = notificationSetting - (weekDay << 11);
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + weekDay - date.getUTCDay());
    date.setUTCHours(minutes / 60, minutes % 60, 0, 0);
    return date;
  }

  isWeekDayActive(weekDay: WeekDay): boolean {
    return !!this.notifications[weekDay];
  }

  currentInfo(): string {
    const date = this.notifications[this.currentIndex]?.[0];
    let str = this.settingInactive;
    if (date) {
      str =
        date.getHours().toString().padStart(2, '0') +
        ':' +
        date.getMinutes().toString().padStart(2, '0');
    }
    return this.lastSetting.replace('%s', str);
  }

  updateDateTo(weekDay: WeekDay) {
    this.currentIndex = weekDay;
    this.date = this.notifications[weekDay]?.[0];
    if (!this.date) {
      this.date = new Date();
      this.date.setUTCDate(
        this.date.getUTCDate() + weekDay - this.date.getUTCDay(),
      );
      this.date.setHours(0, 0, 0, 0);
    }
  }

  ngOnInit(): void {
    if (!user()?.loginId) {
      return;
    }
    this.commentNotificationService
      .findByRoomId(this.room.id)
      .subscribe((settings) => {
        settings.forEach((not) => this.setNotification(not));
        this.isLoading = false;
        this.updateDateTo(WeekDay.Monday);
      });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  confirm() {
    const notificationSetting =
      (this.date.getUTCDay() << 11) |
      (this.date.getUTCHours() * 60 + this.date.getUTCMinutes());
    const dataArr = this.notifications[this.currentIndex];
    const creator = () => {
      this.commentNotificationService
        .createNotification(this.room.id, notificationSetting)
        .subscribe({
          error: () => this.showSomethingWentWrong(),
          next: (not) => this.setNotification(not),
        });
    };
    if (!dataArr) {
      creator();
      return;
    }
    this.commentNotificationService.deleteNotification(dataArr[1]).subscribe({
      error: () => this.showSomethingWentWrong(),
      next: () => {
        this.notifications[this.currentIndex] = null;
        creator();
      },
    });
  }

  deactivate() {
    const dataArr = this.notifications[this.currentIndex];
    this.commentNotificationService.deleteNotification(dataArr[1]).subscribe({
      error: () => this.showSomethingWentWrong(),
      next: () => (this.notifications[this.currentIndex] = null),
    });
  }

  private setNotification(c: CommentNotification) {
    const date = CommentNotificationDialogComponent.notificationSettingToDate(
      c.notificationSetting,
    );
    if (this.notifications[date.getDay()]) {
      console.warn('Notifications should never be overridden!');
    }
    this.notifications[date.getDay()] = [date, c.id];
  }

  private showSomethingWentWrong() {
    this.translateService
      .get('comment-notification.something-went-wrong')
      .subscribe((msg) => this.notificationService.show(msg));
  }
}
