import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import {
  DashboardFilter,
  DashboardNotificationService,
} from '../../../../services/util/dashboard-notification.service';
import { DashboardDialogComponent } from '../dashboard-dialog/dashboard-dialog.component';
import {
  CommentChangeRole,
  CommentChangeType,
} from '../../../../models/comment-change';
import { NotificationEvent } from '../../../../models/dashboard-notification';
import { DeleteAllNotificationsComponent } from '../delete-all-notifications/delete-all-notifications.component';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, takeUntil } from 'rxjs';
import { SessionService } from '../../../../services/util/session.service';
import {
  AppStateService,
  Language,
} from 'app/services/state/app-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AppComponent } from 'app/app.component';

const LANG_KEYS = [
  'PARTICIPANT',
  'EXECUTIVE_MODERATOR',
  'CREATOR',
  'own-question',
  'own-comment',
  'own-question-2',
  'own-comment-2',
  'other-question',
  'other-comment',
  'other-question-2',
  'other-comment-2',
].map((v) => `dashboard-notification.${v}`);

type LanguageMessageObjectFunction = (
  trans: TranslateService,
  notification: NotificationEvent,
  interpolate: object,
) => Observable<any>;

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

type DashboardFilterObjectIcons = {
  [key in DashboardFilter]: {
    condition: () => boolean;
    icon: string;
    iconClass: string;
    activeClass: string;
  };
};

const LANGUAGE_MESSAGES: LanguageMessageObject = {
  [CommentChangeType.CREATED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.other-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    return trans.get(
      `dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}CREATED`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.DELETED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    return trans.get(
      `dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}DELETED`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.ANSWERED]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    return trans.get(
      `dashboard-notification.${not.fromSelf ? 'self-' : 'role-'}ANSWERED`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.CHANGE_ACK]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    const add = '_' + not.currentValueString;
    return trans.get(
      `dashboard-notification.${
        not.fromSelf ? 'self-' : 'role-'
      }CHANGE_ACK${add}`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.CHANGE_FAVORITE]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    const add = '_' + not.currentValueString;
    return trans.get(
      `dashboard-notification.${
        not.fromSelf ? 'self-' : 'role-'
      }CHANGE_FAVORITE${add}`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.CHANGE_CORRECT]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    const add = '_' + not.currentValueString;
    return trans.get(
      `dashboard-notification.${
        not.fromSelf ? 'self-' : 'role-'
      }CHANGE_CORRECT${add}`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
  [CommentChangeType.CHANGE_TAG]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
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
    return trans.get(
      `dashboard-notification.${
        not.fromSelf ? 'self-' : 'role-'
      }CHANGE_TAG${add}`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
        ...addedKeys,
      },
    );
  },
  [CommentChangeType.CHANGE_SCORE]: (trans, not, interpolate) => {
    const key = `dashboard-notification.${not.ownsComment ? 'own' : 'other'}-${
      not.isAnswer ? 'comment' : 'question'
    }`;
    const previous = not.previousValueString.split('/').map((v) => +v);
    const current = not.currentValueString.split('/').map((v) => +v);
    let add;
    if (current[1] - previous[1] === 1) {
      add = '+1';
    } else if (current[2] - previous[2] === 1) {
      add = '-1';
    } else {
      add = '-reset';
    }
    return trans.get(
      `dashboard-notification.${
        not.fromSelf ? 'self-' : 'role-'
      }CHANGE_SCORE${add}`,
      {
        role: interpolate[LANG_KEYS[notificationToIndex(not)]],
        commentTypeInfo: interpolate[key],
        commentTypeInfo2: interpolate[key + '-2'],
      },
    );
  },
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  toggleFilter: boolean = false;
  hasFilter: boolean = false;
  date: string = new Date().toLocaleDateString('de-DE');
  commentChangeType: typeof CommentChangeType = CommentChangeType;
  dashboardFilter: typeof DashboardFilter = DashboardFilter;
  dashboardFilterKeys: string[] = Object.keys(this.dashboardFilter);
  currentLanguage: Language;
  isMobile = false;
  public readonly ICONS: DashboardFilterObjectIcons = {
    [DashboardFilter.QuestionPublished]: {
      condition: () => !this.session.currentRoom?.directSend,
      icon: 'system_security_update_good',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionBanned]: {
      condition: () => true,
      icon: 'gavel',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionNegated]: {
      condition: () => true,
      icon: 'cancel',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionAffirmed]: {
      condition: () => true,
      icon: 'check_circle',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionAnswered]: {
      condition: () => true,
      icon: 'comment',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionMarkedWithStar]: {
      condition: () => true,
      icon: 'grade',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.CommentMarkedWithStar]: {
      condition: () => true,
      icon: 'grade',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionCommented]: {
      condition: () => this.session.currentRoom?.conversationDepth > 0,
      icon: 'forum',
      iconClass: '',
      activeClass: 'activeIcon',
    },
    [DashboardFilter.QuestionDeleted]: {
      condition: () => true,
      icon: 'delete',
      iconClass: 'material-icons-outlined',
      activeClass: 'activeIcon',
    },
  };
  private _prefetchedLangKeys: object = {};
  private _destroyer = new ReplaySubject(1);

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<DashboardComponent>,
    private translationService: TranslateService,
    public http: HttpClient,
    public dialog: MatDialog,
    public change: DashboardNotificationService,
    private router: Router,
    private session: SessionService,
    appState: AppStateService,
    deviceState: DeviceStateService,
  ) {
    appState.language$.pipe(takeUntil(this._destroyer)).subscribe((lang) => {
      this.currentLanguage = lang;
      this.translationService.use(lang);
      this.http
        .get('/assets/i18n/dashboard/' + lang + '.json')
        .subscribe((translation) => {
          this.translationService.setTranslation(lang, translation, true);
          this.updateLanguageKeys();
        });
    });
    deviceState.mobile$
      .pipe(takeUntil(this._destroyer))
      .subscribe((m) => (this.isMobile = m));
  }

  ngOnInit(): void {
    //intentional
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  closeDashboard() {
    this._bottomSheetRef.dismiss();
  }

  toggleNotificationBlock() {
    this.change.isNotificationBlocked = !this.change.isNotificationBlocked;
    if (!this.change.isNotificationBlocked) {
      AppComponent.instance.hasPushSubscription().subscribe((b) => {
        if (!b) {
          AppComponent.instance.registerPush();
        }
      });
    }
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
      width: '400px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteNotes();
      }
    });
  }

  goTo(item: NotificationEvent) {
    this.router.navigate([
      `/participant/room/${item.roomShortId}/comment/${item.commentId}/conversation`,
    ]);
    this._bottomSheetRef.dismiss();
  }

  filterNotification(filter: string) {
    if (this.change.getActiveFilter() === DashboardFilter[filter]) {
      this.hasFilter = false;
      this.change.reset();
      return;
    }
    this.hasFilter = true;
    this.change.filterNotifications(DashboardFilter[filter]);
  }

  getActiveClass(filter: string) {
    if (this.change.getActiveFilter() === DashboardFilter[filter]) {
      return this.ICONS[filter].activeClass;
    }
    return '';
  }

  getNotificationMessage(notification: NotificationEvent) {
    return LANGUAGE_MESSAGES[notification.type](
      this.translationService,
      notification,
      this._prefetchedLangKeys,
    );
  }

  getCommentNumbers(): string[] {
    return [
      ...new Set<string>(
        this.change.getList(this.hasFilter).map((not) => not.commentNumber),
      ),
    ];
  }

  private updateLanguageKeys() {
    this._prefetchedLangKeys = {};
    this.translationService.get(LANG_KEYS).subscribe((messages) => {
      this._prefetchedLangKeys = messages;
    });
  }
}
