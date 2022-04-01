import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DashboardNotificationService } from '../../../../services/util/dashboard-notification.service';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { DashboardDialogComponent } from '../dashboard-dialog/dashboard-dialog.component';
import { CommentChangeRole, CommentChangeType } from '../../../../models/comment-change';
import { NotificationEvent } from '../../../../models/dashboard-notification';
import { DeleteAllNotificationsComponent } from '../delete-all-notifications/delete-all-notifications.component';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

const LANG_KEYS = [
  'PARTICIPANT', 'EXECUTIVE_MODERATOR', 'CREATOR', 'own-question', 'own-comment', 'own-question-2', 'own-comment-2',
  'other-question', 'other-comment', 'other-question-2', 'other-comment-2'
].map(v => `dashboard-notification.${v}`);

type LanguageMessageObjectFunction = (trans: TranslateService, notification: NotificationEvent, interpolate: object) => Observable<any>;

type LanguageMessageObject = {
  [changeType in CommentChangeType]: LanguageMessageObjectFunction;
};

const notificationToIndex = (not: NotificationEvent) => {
  switch (not.initiatorRole) {
    case CommentChangeRole.CREATOR:
      return 2;
    case CommentChangeRole.EDITING_MODERATOR:
    case CommentChangeRole.EXECUTIVE_MODERATOR:
      return 1;
    default:
      return 0;
  }
};

const LANGUAGE_MESSAGES: LanguageMessageObject = {
  [CommentChangeType.CREATED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.other-${not.isAnswer ? 'comment' : 'question'}`;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CREATED`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.DELETED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}DELETED`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.ANSWERED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}ANSWERED`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.CHANGE_ACK]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    const add = '_' + not.currentValueString;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CHANGE_ACK${add}`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.CHANGE_FAVORITE]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    const add = '_' + not.currentValueString;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CHANGE_FAVORITE${add}`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.CHANGE_CORRECT]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    const add = '_' + not.currentValueString;
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CHANGE_CORRECT${add}`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
  [CommentChangeType.CHANGE_TAG]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    let add;
    const addedKeys = {};
    if (not.currentValueString) {
      if (not.previousValueString) {
        add = '-change';
        addedKeys['tag1'] = not.previousValueString;
        addedKeys['tag2'] = not.currentValueString;
      } else {
        add = '-new';
        addedKeys['tag'] = not.currentValueString;
      }
    } else {
      add = '-deleted';
      addedKeys['tag'] = not.previousValueString;
    }
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CHANGE_TAG${add}`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
      ...addedKeys,
    });
  },
  [CommentChangeType.CHANGE_SCORE]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${not.isAnswer ? 'comment' : 'question'}`;
    const previous = not.previousValueString.split('/').map(v => +v);
    const current = not.currentValueString.split('/').map(v => +v);
    let add;
    if (current[1] - previous[1] === 1) {
      add = '+1';
    } else if (current[2] - previous[2] === 1) {
      add = '-1';
    } else {
      add = '-reset';
    }
    return trans.get(`dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CHANGE_SCORE${add}`, {
      role: interpolate[LANG_KEYS[notificationToIndex(not)]],
      commentTypeInfo: interpolate[key],
      commentTypeInfo2: interpolate[key + '-2'],
    });
  },
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  toggleFilter: boolean = false;
  hasFilter: boolean = false;
  date: string = new Date().toLocaleDateString('de-DE');
  commentChangeType: typeof CommentChangeType = CommentChangeType;
  private _prefetchedLangKeys: object = {};

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<DashboardComponent>,
    public languageService: LanguageService,
    private translationService: TranslateService,
    public http: HttpClient,
    public dialog: MatDialog,
    public deviceInfo: DeviceInfoService,
    public change: DashboardNotificationService,
    private router: Router,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translationService.use(lang);
      this.http.get('/assets/i18n/dashboard/' + lang + '.json')
        .subscribe(translation => {
          this.translationService.setTranslation(lang, translation, true);
          this.updateLanguageKeys();
        });
    });
  }

  ngOnInit(): void {
    //intentional
  }

  closeDashboard() {
    this._bottomSheetRef.dismiss();
  }

  toggleNotificationBlock() {
    this.change.isNotificationBlocked = !this.change.isNotificationBlocked;
  }

  deleteNotes() {
    this.change.deleteAll();
  }

  showExplanationDashboard() {
    this.dialog.open(DashboardDialogComponent, {});
  }

  openDeleteNotifDialog(): void {
    if (this.change.getList().length === 0) {
      return;
    }
    const dialogRef = this.dialog.open(DeleteAllNotificationsComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteNotes();
        }
      });
  }

  goTo(item: NotificationEvent) {
    this.router.navigate([`/participant/room/${item.roomShortId}/comment/${item.commentId}/conversation`]);
    this._bottomSheetRef.dismiss();
  }

  filterNotification(msg: string) {
    this.hasFilter = true;
    switch (msg) {
      case 'star':
        this.change.filterNotifications(this.commentChangeType.CHANGE_FAVORITE);
        break;
      case 'check_circle':
        this.change.filterNotifications(this.commentChangeType.CHANGE_CORRECT);
        break;
      case 'delete':
        this.change.filterNotifications(this.commentChangeType.DELETED);
        break;
      case 'ban':
        this.change.filterNotifications(this.commentChangeType.CHANGE_ACK);
        break;
      case 'question_answer':
        this.change.filterNotifications(this.commentChangeType.ANSWERED);
        break;
      case 'publish':
        this.change.filterNotifications(this.commentChangeType.CREATED);
        break;
    }
  }

  getNotificationMessage(notification: NotificationEvent) {
    return LANGUAGE_MESSAGES[notification.type](this.translationService, notification, this._prefetchedLangKeys);
  }

  getCommentNumbers(): string[] {
    return [...new Set<string>(this.change.getList(this.hasFilter).map(not => not.commentNumber))];
  }

  private updateLanguageKeys() {
    this._prefetchedLangKeys = {};
    this.translationService.get(LANG_KEYS).subscribe(messages => {
      this._prefetchedLangKeys = messages;
    });
  }
}
