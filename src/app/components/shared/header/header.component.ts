import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/http/user.service';
import { EventService } from '../../../services/util/event.service';
import { AppComponent } from '../../../app.component';
import { Rescale } from '../../../models/rescale';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { UserBonusTokenComponent } from '../../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { RemindOfTokensComponent } from '../../participant/_dialogs/remind-of-tokens/remind-of-tokens.component';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { TagCloudDataService } from '../../../services/util/tag-cloud-data.service';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { HeaderService } from '../../../services/util/header.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { ArsComposeHostDirective } from '../../../../../projects/ars/src/lib/compose/ars-compose-host.directive';
import { ThemeService } from '../../../../theme/theme.service';
import { SessionService } from '../../../services/util/session.service';
import { CommentNotificationService } from '../../../services/http/comment-notification.service';
import { BrainstormingDataService } from 'app/services/util/brainstorming-data.service';
import { Theme } from 'theme/Theme';
import {
  getBrainstormingURL,
  livepollNavigationAccessOnRoute,
  navigateBrainstorming,
  navigateTopicCloud,
} from '../navigation/navigation.component';
import { PseudonymEditorComponent } from '../_dialogs/pseudonym-editor/pseudonym-editor.component';
import { CommentNotificationDialogComponent } from '../_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { GptOptInPrivacyComponent } from '../_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { ShrinkObserver } from 'app/utils/shrink-observer';
import { LivepollService } from '../../../services/http/livepoll.service';
import { GptService } from 'app/services/http/gpt.service';
import { GPTChatInfoComponent } from '../_dialogs/gptchat-info/gptchat-info.component';
import { KeycloakService } from 'app/services/util/keycloak.service';
import { KeycloakRoles, User } from 'app/models/user';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import {
  AppStateService,
  ThemeKey,
} from 'app/services/state/app-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { LocationStateService } from 'app/services/state/location-state.service';
import { MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { M3DialogBuilderService } from '../../../../modules/m3/services/dialog/m3-dialog-builder.service';
import { M3DynamicThemeService } from '../../../../modules/m3/services/dynamic-theme/m3-dynamic-theme.service';
import { Language, setLanguage } from 'app/base/language/language';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ArsComposeHostDirective) host: ArsComposeHostDirective;
  @ViewChild('toolbarRow') toolbarRow: ElementRef<HTMLElement>;
  @ViewChild('themeMenu') themeMenu: MatMenu;
  @ViewChild('langMenu') languageMenu: MatMenu;
  user: User;
  userRole: UserRole;
  actualRole: UserRole;
  cTime: string;
  motdState = false;
  room: Room;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  commentsCountKeywords = 0;
  isAdminConfigEnabled = false;
  isInRouteWithRoles = false;
  hasEmailNotifications = false;
  hasKeywords = false;
  themes: Theme[];
  showSmallButtons = false;
  isGPTPrivacyPolicyAccepted: boolean = false;
  canOpenGPT = false;
  /**
   * @deprecated
   */
  customOptionText: { key: string; noTranslate?: boolean } = null;
  isSuperAdmin = false;
  currentLanguage: Language = 'en';
  isMobile = false;
  isSafari = false;
  roleToRoute = {
    0: 'participant',
    1: 'moderator',
    2: 'moderator',
    3: 'creator',
  };
  public readonly navigationAccess = {
    livepoll: livepollNavigationAccessOnRoute,
  };
  private shrinkObserver: ShrinkObserver;
  private destroyer = new ReplaySubject(1);

  constructor(
    public notificationService: NotificationService,
    public router: Router,
    public translationService: TranslateService,
    public dialog: MatDialog,
    private userService: UserService,
    public eventService: EventService,
    private bonusTokenService: BonusTokenService,
    private _r: Renderer2,
    private roomService: RoomService,
    public topicCloudAdminService: TopicCloudAdminService,
    public headerService: HeaderService,
    private onboardingService: OnboardingService,
    public themeService: ThemeService,
    public sessionService: SessionService,
    public tagCloudDataService: TagCloudDataService,
    private commentNotificationService: CommentNotificationService,
    private brainstormingDataService: BrainstormingDataService,
    public readonly livepollService: LivepollService,
    private gptService: GptService,
    private route: ActivatedRoute,
    private keycloakService: KeycloakService,
    private appState: AppStateService,
    private accountState: AccountStateService,
    protected roomState: RoomStateService,
    private locationState: LocationStateService,
    private m3DialogService: M3DialogBuilderService,
    protected readonly m3ThemeService: M3DynamicThemeService,
    deviceState: DeviceStateService,
  ) {
    this.appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
    this.isSafari = deviceState.isSafari;
  }

  ngAfterViewInit() {
    this.headerService.isActive = true;
    this.headerService.initHeader(() => this);
    if (this.toolbarRow) {
      this.shrinkObserver = new ShrinkObserver(this.toolbarRow?.nativeElement);
      this.shrinkObserver
        .observeShrink()
        .subscribe((shrinked) => (this.showSmallButtons = shrinked));
    }
  }

  ngOnInit() {
    this.sessionService.onReady.subscribe(() => {
      this.init();
    });
    this.themes = this.themeService.getThemes();
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  init() {
    this.roomState.assignedRole$.subscribe((role) => {
      this.userRole = ROOM_ROLE_MAPPER[role] ?? null;
      this.isInRouteWithRoles = Boolean(
        this.locationState.getCurrentRecognized()?.metadata?.isRoom,
      );
    });
    this.roomState.role$.subscribe((role) => {
      this.actualRole = ROOM_ROLE_MAPPER[role] ?? null;
    });
    this.sessionService.getGPTStatus().subscribe((status) => {
      this.canOpenGPT = Boolean(status) && !status.restricted;
    });
    this.topicCloudAdminService.getAdminData.subscribe((data) => {
      this.isAdminConfigEnabled =
        !TopicCloudAdminService.isTopicRequirementDisabled(data);
    });
    this.tagCloudDataService.getMetaData().subscribe((data) => {
      if (!data) {
        return;
      }
      this.commentsCountQuestions = data.commentCount;
      this.commentsCountUsers = data.userCount;
      this.commentsCountKeywords = data.tagCount;
    });
    this.brainstormingDataService.getMetaData().subscribe((data) => {
      if (!data) {
        return;
      }
      this.commentsCountQuestions = data.commentCount;
      this.commentsCountUsers = data.userCount;
      this.commentsCountKeywords = data.tagCount;
    });
    this.accountState.user$
      .pipe(takeUntil(this.destroyer))
      .subscribe((newUser) => {
        this.user = newUser;
        this.isSuperAdmin =
          this.user?.hasRole?.(KeycloakRoles.AdminDashboard) || false;
      });

    let time = new Date();
    this.getTime(time);
    setInterval(() => {
      time = new Date();
      this.getTime(time);
    }, 1000);

    this.sessionService.getRoom().subscribe((room) => {
      this.room = room;
      this.refreshNotifications();
      this.refreshLivepollNotification();
    });

    this._r.listen(document, 'keyup', (event) => {
      if (
        document.getElementById('back-button') &&
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit0) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('back-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit2) === true &&
        this.eventService.focusOnInput === false
      ) {
        if (this.user) {
          document.getElementById('session-button').focus();
        } else {
          document.getElementById('login-button').focus();
        }
      }
    });
    this.accountState.unreadMotds$
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => (this.motdState = state));
  }

  useLanguage(language: Language) {
    this.translationService.use(language);
    setLanguage(language);
  }

  getTime(time: Date) {
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    this.cTime = hh + ':' + mm;
  }

  logout() {
    if (!this.user.isGuest) {
      this.logoutUser();
      return;
    }
    this.bonusTokenService.getTokensByUserId(this.user.id).subscribe((list) => {
      if (!list || list.length < 1) {
        this.logoutUser();
        return;
      }
      const dialogRef = this.dialog.open(RemindOfTokensComponent, {
        width: '600px',
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'abort') {
          UserBonusTokenComponent.openDialog(this.dialog, this.user?.id);
        } else if (result === 'logout') {
          this.logoutUser();
        }
      });
    });
  }

  logoutUser() {
    this.accountState.logout().subscribe();
  }

  startTour() {
    this.onboardingService.startDefaultTour(true);
  }

  login() {
    this.accountState.openLogin().subscribe({
      error: (e) => console.error(e),
    });
  }

  routeAdmin() {
    this.router.navigate(['/admin/overview']);
  }

  routeAccountManagement() {
    this.keycloakService.redirectAccountManagement();
  }

  /**
   * @deprecated
   */
  startUpFinished() {
    return this.sessionService.isReady;
  }

  openUserBonusTokenDialog() {
    UserBonusTokenComponent.openDialog(this.dialog, this.user?.id);
  }

  /*Rescale*/

  /**
   * Access to static Rescale from AppComponent
   * returns Rescale from AppComponent
   */
  public getRescale(): Rescale {
    return AppComponent.rescale;
  }

  public navigateQuestionBoard() {
    this.eventService.broadcast('navigate', 'questionBoard');
  }

  public refreshNotifications() {
    this.hasEmailNotifications = false;
    const id = this.sessionService.currentRoom?.id;
    if (!id || !this.user?.loginId) {
      return;
    }
    this.commentNotificationService.findByRoomId(id).subscribe({
      next: (value) => (this.hasEmailNotifications = !!value?.length),
    });
  }

  public navigateToOtherView() {
    const userRoleToRoomRole = {
      0: 'Participant',
      1: 'Moderator',
      2: 'Moderator',
      3: 'Creator',
    } as const;
    this.roomState.assignRole(
      this.userRole !== this.actualRole
        ? userRoleToRoomRole[this.actualRole]
        : 'Participant',
    );
  }

  navigateCloud() {
    navigateTopicCloud(
      this.router,
      this.eventService,
      this.dialog,
      this.userRole,
    );
  }

  public navigateBrainstormingDialog() {
    navigateBrainstorming(this.dialog, this.router, this.userRole);
  }

  public navigateBrainstormingDirectly() {
    this.router.navigate([getBrainstormingURL(decodeURI(this.router.url))]);
  }

  public getCurrentRoleIcon() {
    if (this.isSuperAdmin) {
      return 'manage_accounts';
    } else if (this.actualRole === UserRole.EXECUTIVE_MODERATOR) {
      return 'support_agent';
    } else if (this.actualRole === UserRole.CREATOR) {
      return 'co_present';
    }
    return 'person';
  }

  public getCurrentRoleDescription(): string {
    if (this.isSuperAdmin) {
      return 'tooltip-super-admin';
    } else if (this.actualRole === UserRole.EXECUTIVE_MODERATOR) {
      return 'tooltip-moderator';
    } else if (this.actualRole === UserRole.CREATOR) {
      return 'tooltip-creator';
    }
    return 'tooltip-participant';
  }

  openMenu() {
    const active = this.themeService.activeTheme.key;
    const index = this.themes.findIndex((theme) => theme.key === active);
    if (index < 0) {
      return;
    }
    this.themeMenu._allItems.get(index).focus();
  }

  openLanguageMenu() {
    if (this.currentLanguage === 'de') {
      this.languageMenu._allItems.get(0).focus();
    } else if (this.currentLanguage === 'en') {
      this.languageMenu._allItems.get(1).focus();
    } else if (this.currentLanguage === 'fr') {
      this.languageMenu._allItems.get(2).focus();
    }
  }

  openPseudoEditor() {
    PseudonymEditorComponent.open(this.dialog, this.user.id, this.room.id);
  }

  openEmailNotification(): void {
    if (!this.user?.loginId) {
      this.translationService
        .get('comment-notification.needs-user-account')
        .subscribe((msg) =>
          this.notificationService.show(msg, undefined, {
            duration: 7000,
            panelClass: ['snackbar', 'important'],
          }),
        );
      return;
    }
    CommentNotificationDialogComponent.openDialog(this.dialog, this.room);
  }

  openBrainstormingGPT() {
    if (!this.canOpenGPT) {
      GPTChatInfoComponent.open(this.dialog);
      return;
    }
    this.eventService.broadcast('tag-cloud.brainstorming-ideas-with-chatgpt');
  }

  openGPT() {
    if (!this.canOpenGPT) {
      GPTChatInfoComponent.open(this.dialog);
      return;
    }
    let roleString = 'participant';
    if (this.userRole === UserRole.CREATOR) {
      roleString = 'creator';
    } else if (this.userRole > UserRole.PARTICIPANT) {
      roleString = 'moderator';
    }
    const url = `/${roleString}/room/${this.room.shortId}/gpt-chat-room`;
    this.router.navigate([url]);
  }

  openPrivacyDialog() {
    const dialogRef = this.dialog.open(GptOptInPrivacyComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.accountState.updateGPTConsentState(result);
    });
  }

  changeTheme(theme: Theme) {
    this.themeService.activate(theme.key as ThemeKey);
    this.updateScale(theme.getScale(this.isMobile ? 'mobile' : 'desktop'));
  }

  updateScale(scale: number) {
    AppComponent.rescale.setInitialScale(scale);
    AppComponent.rescale.setDefaultScale(scale);
  }

  openLivepollDialog() {
    this.livepollService.open(this.sessionService);
  }

  private refreshLivepollNotification() {
    if (this.livepollService.isOpen)
      this.sessionService.getRoomOnce().subscribe((room) => {
        if (room.livepollSession) {
          this.livepollService.open(this.sessionService);
        }
      });
  }

  // openGPTPrivacyDialog() {
  //   const dialogRef = this.dialog.open(GptOptInPrivacyComponent);
  // }
}
