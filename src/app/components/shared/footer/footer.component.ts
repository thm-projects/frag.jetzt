import {
  Language,
  LanguageService,
} from '../../../services/util/language.service';
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { ComponentType } from '@angular/cdk/overlay';
import { IntroductionRoomListComponent } from '../_dialogs/introductions/introduction-room-list/introduction-room-list.component';
import { IntroductionRoomPageComponent } from '../_dialogs/introductions/introduction-room-page/introduction-room-page.component';
import { IntroductionCommentListComponent } from '../_dialogs/introductions/introduction-comment-list/introduction-comment-list.component';
import { IntroductionModerationComponent } from '../_dialogs/introductions/introduction-moderation/introduction-moderation.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DashboardComponent } from '../_dialogs/dashboard/dashboard.component';
import { DashboardNotificationService } from '../../../services/util/dashboard-notification.service';
import { UserManagementService } from '../../../services/util/user-management.service';
import { SessionService } from '../../../services/util/session.service';
import { IntroductionPromptGuideChatbotComponent } from '../_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  @ViewChild('langMenu') langaugeMenu: MatMenu;
  public demoId = 'Feedback';
  public room: Room;
  public user: User;
  public open: string;
  public themes: Theme[];
  private _tourSite: ComponentType<any>;

  constructor(
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog,
    private translateService: TranslateService,
    public langService: LanguageService,
    public userManagementService: UserManagementService,
    public themeService: ThemeService,
    private styleService: StyleService,
    public deviceInfo: DeviceInfoService,
    public dashboard: MatBottomSheet,
    public change: DashboardNotificationService,
    private sessionService: SessionService,
  ) {
    this.userManagementService
      .getUser()
      .subscribe((user) => (this.user = user));
  }

  get tourSite() {
    return this._tourSite;
  }

  ngOnInit() {
    this.sessionService.onReady.subscribe(() => this.init());
  }

  init() {
    this.translateService.get('footer.open').subscribe((message) => {
      this.open = message;
    });
    this.themes = this.themeService.getThemes();
    this.updateScale(
      this.themeService.currentTheme.getScale(
        this.deviceInfo.isCurrentlyMobile ? 'mobile' : 'desktop',
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
    this.langService.setLanguage(language);
  }

  changeTheme(theme: Theme) {
    this.themeService.activate(theme.key);
    this.updateScale(
      theme.getScale(this.deviceInfo.isCurrentlyMobile ? 'mobile' : 'desktop'),
    );
  }

  updateScale(scale: number) {
    AppComponent.rescale.setInitialScale(scale);
    AppComponent.rescale.setDefaultScale(scale);
  }

  openMenu() {
    if (this.langService.currentLanguage() === 'de') {
      this.langaugeMenu._allItems.get(0).focus();
    } else if (this.langService.currentLanguage() === 'en') {
      this.langaugeMenu._allItems.get(1).focus();
    } else if (this.langService.currentLanguage() === 'fr') {
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
    console.log(url);
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
    } else if (url.endsWith('/gpt-chat')) {
      this._tourSite = IntroductionPromptGuideChatbotComponent;
    } else {
      this._tourSite = null;
    }
  }
}
