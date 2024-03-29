import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { DemoVideoComponent } from '../../home/_dialogs/demo-video/demo-video.component';
import { ThemeService } from '../../../../theme/theme.service';
import { ImprintComponent } from '../../home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from '../../home/_dialogs/data-protection/data-protection.component';
import { Theme } from '../../../../theme/Theme';
import { AppComponent } from '../../../app.component';
import { StyleService } from '../../../../../projects/ars/src/lib/style/style.service';
import { MatMenu } from '@angular/material/menu';
import { ComponentType } from '@angular/cdk/overlay';
import { IntroductionRoomListComponent } from '../_dialogs/introductions/introduction-room-list/introduction-room-list.component';
import { IntroductionRoomPageComponent } from '../_dialogs/introductions/introduction-room-page/introduction-room-page.component';
import { IntroductionCommentListComponent } from '../_dialogs/introductions/introduction-comment-list/introduction-comment-list.component';
import { IntroductionModerationComponent } from '../_dialogs/introductions/introduction-moderation/introduction-moderation.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DashboardComponent } from '../_dialogs/dashboard/dashboard.component';
import { DashboardNotificationService } from '../../../services/util/dashboard-notification.service';
import { SessionService } from '../../../services/util/session.service';
import {
  AppStateService,
  Language,
  ThemeKey,
} from 'app/services/state/app-state.service';
import { ReplaySubject, filter, take, takeUntil, tap } from 'rxjs';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit, OnDestroy {
  @ViewChild('langMenu') langaugeMenu: MatMenu;
  public demoId = 'Feedback';
  public room: Room;
  public user: User;
  public open: string;
  public themes: Theme[];
  currentLanguage: Language = 'en';
  isMobile = false;
  private _tourSite: ComponentType<any>;
  private destroyer = new ReplaySubject(1);

  constructor(
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog,
    private translateService: TranslateService,
    public themeService: ThemeService,
    private styleService: StyleService,
    public dashboard: MatBottomSheet,
    public change: DashboardNotificationService,
    private sessionService: SessionService,
    private appState: AppStateService,
    deviceState: DeviceStateService,
    accountState: AccountStateService,
  ) {
    accountState.user$
      .pipe(takeUntil(this.destroyer))
      .subscribe((user) => (this.user = user));
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
  }

  get tourSite() {
    return this._tourSite;
  }

  ngOnInit() {
    this.themeService
      .getTheme()
      .pipe(
        filter((v) => Boolean(v)),
        take(1),
      )
      .subscribe(() => {
        this.init();
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  init() {
    this.translateService.get('footer.open').subscribe((message) => {
      this.open = message;
    });
    this.themes = this.themeService.getThemes();
    this.updateScale(
      this.themeService.currentTheme.getScale(
        this.isMobile ? 'mobile' : 'desktop',
      ),
    );
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.onEnd();
      }
    });
    this.onEnd();
  }

  showDemo() {
    this.dialog.open(DemoVideoComponent, {
      width: '80%',
      maxWidth: '600px',
    });
  }

  showCurrentTour() {
    if (!this._tourSite) {
      return;
    }
    this.dialog.open(this._tourSite, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
  }

  showImprint() {
    this.dialog.open(ImprintComponent, {
      width: '80%',
      maxWidth: '600px',
    });
  }

  showDataProtection() {
    this.dialog.open(DataProtectionComponent, {
      width: '80%',
      maxWidth: '600px',
    });
  }

  useLanguage(language: Language) {
    this.translateService.use(language);
    this.appState.changeLanguage(language);
  }

  changeTheme(theme: Theme) {
    this.themeService.activate(theme.key as ThemeKey);
    this.updateScale(theme.getScale(this.isMobile ? 'mobile' : 'desktop'));
  }

  updateScale(scale: number) {
    AppComponent.rescale.setInitialScale(scale);
    AppComponent.rescale.setDefaultScale(scale);
  }

  openMenu() {
    if (this.currentLanguage === 'de') {
      this.langaugeMenu._allItems.get(0).focus();
    } else if (this.currentLanguage === 'en') {
      this.langaugeMenu._allItems.get(1).focus();
    } else if (this.currentLanguage === 'fr') {
      this.langaugeMenu._allItems.get(2).focus();
    }
  }

  openDashboard() {
    this.dashboard.open(DashboardComponent);
  }

  private onEnd() {
    const url = decodeURI(this.router.url).toLowerCase();
    const roleRegex = '/(creator|moderator|participant)';
    const roomRegex = '/room/[^/]{3,}';
    if (url === '/user') {
      this._tourSite = IntroductionRoomListComponent;
    } else if (url.match(new RegExp(`^${roleRegex}${roomRegex}$`))) {
      this._tourSite = IntroductionRoomPageComponent;
    } else if (url.match(new RegExp(`^${roleRegex}${roomRegex}/comments$`))) {
      this._tourSite = IntroductionCommentListComponent;
    } else if (
      url.match(new RegExp(`^${roleRegex}${roomRegex}/moderator/comments$`))
    ) {
      this._tourSite = IntroductionModerationComponent;
    } else {
      this._tourSite = null;
    }
  }
}
