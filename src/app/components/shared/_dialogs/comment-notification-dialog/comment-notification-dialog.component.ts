import { Component, Input, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { CommentNotificationService } from '../../../../services/http/comment-notification.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { CommentNotification } from '../../../../models/comment-notification';
import { AuthenticationService } from '../../../../services/http/authentication.service';

enum WeekDay {
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday
}

@Component({
  selector: 'app-comment-notification-dialog',
  templateUrl: './comment-notification-dialog.component.html',
  styleUrls: ['./comment-notification-dialog.component.scss']
})
export class CommentNotificationDialogComponent implements OnInit {

  @Input() room: Room;
  date: Date;
  currentIndex = 0;
  isLoading = true;
  private notifications: [Date, string][] = [null, null, null, null, null, null, null];
  private lastSetting: string;
  private settingInactive: string;

  constructor(
    private dialogRef: MatDialogRef<CommentNotificationDialogComponent>,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private commentNotificationService: CommentNotificationService,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
      this.translateService.get('comment-notification.last-setting')
        .subscribe(text => this.lastSetting = text);
      this.translateService.get('comment-notification.setting-inactive')
        .subscribe(text => this.settingInactive = text);
    });
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
      str = date.getHours().toString().padStart(2, '0') + ':' +
        date.getMinutes().toString().padStart(2, '0');
    }
    return this.lastSetting.replace('%s', str);
  }

  updateDateTo(weekDay: WeekDay) {
    this.currentIndex = weekDay;
    this.date = this.notifications[weekDay]?.[0];
    if (!this.date) {
      this.date = new Date();
      this.date.setUTCDate(this.date.getUTCDate() + weekDay - this.date.getUTCDay());
      this.date.setHours(0, 0, 0, 0);
    }
  }

  ngOnInit(): void {
    if (!this.authenticationService.getUser()?.loginId) {
      return;
    }
    this.commentNotificationService.findByRoomId(this.room.id).subscribe(settings => {
      settings.forEach(not => this.setNotification(not));
      this.isLoading = false;
      this.updateDateTo(WeekDay.monday);
    });
  }

  confirm() {
    const notificationSetting = (this.date.getUTCDay() << 11) |
      (this.date.getUTCHours() * 60 + this.date.getUTCMinutes());
    const dataArr = this.notifications[this.currentIndex];
    const creator = () => {
      this.commentNotificationService.createNotification(this.room.id, notificationSetting).subscribe({
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
      }
    });
  }

  deactivate() {
    const dataArr = this.notifications[this.currentIndex];
    this.commentNotificationService.deleteNotification(dataArr[1]).subscribe({
      error: () => this.showSomethingWentWrong(),
      next: () => this.notifications[this.currentIndex] = null,
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private setNotification(c: CommentNotification) {
    const date = CommentNotificationDialogComponent.notificationSettingToDate(c.notificationSetting);
    if (!!this.notifications[date.getDay()]) {
      console.warn('Notifications should never be overridden!');
    }
    this.notifications[date.getDay()] = [date, c.id];
  }

  private showSomethingWentWrong() {
    this.translateService.get('comment-notification.something-went-wrong')
      .subscribe(msg => this.notificationService.show(msg));
  }

}
