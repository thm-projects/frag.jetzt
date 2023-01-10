import {
  AfterViewInit,
  Component,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { NavigationEnd, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { DeleteAccountComponent } from '../_dialogs/delete-account/delete-account.component';
import { UserService } from '../../../services/http/user.service';
import { EventService } from '../../../services/util/event.service';
import { AppComponent } from '../../../app.component';
import { Rescale } from '../../../models/rescale';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { UserBonusTokenComponent } from '../../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { RemindOfTokensComponent } from '../../participant/_dialogs/remind-of-tokens/remind-of-tokens.component';
import { QrCodeDialogComponent } from '../_dialogs/qr-code-dialog/qr-code-dialog.component';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { TagCloudDataService } from '../../../services/util/tag-cloud-data.service';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { HeaderService } from '../../../services/util/header.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { ArsComposeHostDirective } from '../../../../../projects/ars/src/lib/compose/ars-compose-host.directive';
import { ThemeService } from '../../../../theme/theme.service';
import { TopicCloudBrainstormingComponent } from '../_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { SessionService } from '../../../services/util/session.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { CommentNotificationService } from '../../../services/http/comment-notification.service';
import {
  ManagedUser,
  UserManagementService,
} from '../../../services/util/user-management.service';
import { StartUpService } from '../../../services/util/start-up.service';
import { BrainstormingDataService } from 'app/services/util/brainstorming-data.service';
import { filter } from 'rxjs';
import { RoomSettingsOverviewComponent } from '../_dialogs/room-settings-overview/room-settings-overview.component';
import { BonusTokenComponent } from 'app/components/creator/_dialogs/bonus-token/bonus-token.component';
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';

interface LocationData {
  id: string;
  accessible: boolean;
  active: boolean;
}

interface PossibleLocation {
  i18n: string;
  icon?: string;
  svgIcon?: string;
  class?: string;
  outside?: boolean;
  isCurrentRoute: (route: string) => boolean;
  canBeAccessedOnRoute: (route: string) => boolean;
  navigate: (route: string) => void;
}

type AppLocation = PossibleLocation & LocationData;

const ROOM_REGEX = /^\/(creator|moderator|participant)\/room\/([^/]*)\/?/i;
const COMMENTS_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/?$/i;
const MODERATION_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/moderator\/comments\/?$/i;
const FOCUS_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/questionwall\/?$/i;
const RADAR_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/tagcloud\/?$/i;
const BRAINSTORMING_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/brainstorming\/?$/i;
const QUIZ_REGEX = /^\/quiz\/?$/i;
const RECEPTION_REGEX =
  /^\/(creator|moderator|participant)\/room\/([^/]*)\/?$/i;
const USER_REGEX = /^\/user\/?$/i;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChild(ArsComposeHostDirective) host: ArsComposeHostDirective;
  user: ManagedUser;
  userRole: UserRole;
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
  possibleLocationsEmpty = false;
  readonly possibleLocations: AppLocation[] = [
    {
      id: 'back',
      accessible: true,
      active: false,
      i18n: 'header.back-button',
      icon: 'arrow_back',
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) => route !== '/home',
      navigate: () => {
        this.goBack();
      },
    },
    {
      id: 'forum',
      accessible: false,
      active: false,
      i18n: 'header.back-to-questionboard',
      icon: 'forum',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) => COMMENTS_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}/comments`]);
      },
    },
    {
      id: 'moderation',
      accessible: false,
      active: false,
      i18n: 'header.moderationboard',
      icon: 'gavel',
      class: 'material-icons-round',
      isCurrentRoute: (route) => MODERATION_REGEX.test(route),
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}/moderator/comments`]);
      },
    },
    {
      id: 'focus',
      accessible: false,
      active: false,
      i18n: 'header.questionwall',
      svgIcon: 'beamer',
      isCurrentRoute: (route) => FOCUS_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([
          `participant/room/${data[2]}/comments/questionwall`,
        ]);
      },
    },
    {
      id: 'radar',
      accessible: false,
      active: false,
      i18n: 'header.tag-cloud',
      icon: 'radar',
      isCurrentRoute: (route) => RADAR_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: () => {
        this.navigateTopicCloud();
      },
    },
    {
      id: 'brainstorming',
      accessible: false,
      active: false,
      i18n: 'header.brainstorming',
      icon: 'tips_and_updates',
      class: 'btn-green',
      isCurrentRoute: (route) => BRAINSTORMING_REGEX.test(route),
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) && this.room?.brainstormingActive,
      navigate: (route) => {
        if (BRAINSTORMING_REGEX.test(route)) {
          return;
        }
        if (this.sessionService.currentRole > UserRole.PARTICIPANT) {
          this.navigateBrainstorming();
          return;
        }
        const data = route.match(ROOM_REGEX);
        this.router.navigate([
          `${data[1]}/room/${data[2]}/comments/brainstorming`,
        ]);
      },
    },
    {
      id: 'quiz',
      accessible: false,
      active: false,
      i18n: 'header.quiz-now',
      icon: 'rocket_launch',
      isCurrentRoute: (route) => QUIZ_REGEX.test(route),
      canBeAccessedOnRoute: () => this.room?.quizActive,
      navigate: () => {
        this.router.navigate(['/quiz']);
      },
    },
    {
      id: 'reception',
      accessible: false,
      active: false,
      i18n: 'header.back-to-room',
      icon: 'checkroom',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) =>
        RECEPTION_REGEX.test(route) &&
        this.sessionService.currentRole === UserRole.PARTICIPANT,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole === UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}`]);
      },
    },
    {
      id: 'room management',
      accessible: false,
      active: false,
      i18n: 'header.back-to-room-moderator',
      icon: 'settings',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) =>
        RECEPTION_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}`]);
      },
    },
    {
      id: 'rooms',
      accessible: false,
      active: false,
      i18n: 'header.my-sessions',
      icon: 'meeting_room',
      class: 'material-icons-outlined',
      outside: true,
      isCurrentRoute: (route) => USER_REGEX.test(route),
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.router.navigate(['/user']);
      },
    },
    {
      id: 'user stars',
      accessible: false,
      active: false,
      i18n: 'header.user-bonus-token',
      icon: 'grade',
      class: 'btn-yellow',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        Boolean(this.userManagementService.getCurrentUser()) &&
        (!ROOM_REGEX.test(route) ||
          this.sessionService.currentRole === UserRole.PARTICIPANT),
      navigate: () => {
        this.openUserBonusTokenDialog();
      },
    },
    {
      id: 'bonus archive',
      accessible: false,
      active: false,
      i18n: 'header.bonustoken',
      icon: 'grade',
      class: 'btn-yellow',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT &&
        this.room?.bonusArchiveActive,
      navigate: () => {
        const dialogRef = this.dialog.open(BonusTokenComponent, {
          width: '400px',
        });
        dialogRef.componentInstance.room = this.room;
      },
    },
    {
      id: 'qr code',
      accessible: false,
      active: false,
      i18n: 'header.room-qr',
      icon: 'qr_code',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: () => {
        this.showQRDialog();
      },
    },
    {
      id: 'room settings',
      accessible: false,
      active: false,
      i18n: 'room-list.settings-overview',
      icon: 'room_preferences',
      class: 'btn-primary',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: () => {
        const ref = this.dialog.open(RoomSettingsOverviewComponent, {
          width: '600px',
        });
        ref.componentInstance.room = this.room;
      },
    },
    {
      id: 'news',
      accessible: false,
      active: false,
      i18n: 'header.motd',
      icon: 'campaign',
      class: 'material-icons-outlined',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.startUpService.openMotdDialog();
      },
    },
    {
      id: 'logout',
      accessible: false,
      active: false,
      i18n: 'header.logout',
      icon: 'logout',
      class: 'btn-red',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.userManagementService.logout();
      },
    },
  ];
  currentLocation: PossibleLocation;
  private _clockCount = 0;

  constructor(
    public location: Location,
    public userManagementService: UserManagementService,
    public notificationService: NotificationService,
    public router: Router,
    public translationService: TranslateService,
    public dialog: MatDialog,
    private userService: UserService,
    public eventService: EventService,
    private bonusTokenService: BonusTokenService,
    private _r: Renderer2,
    private confirmDialog: MatDialog,
    private roomService: RoomService,
    public topicCloudAdminService: TopicCloudAdminService,
    public headerService: HeaderService,
    private onboardingService: OnboardingService,
    public themeService: ThemeService,
    public sessionService: SessionService,
    public tagCloudDataService: TagCloudDataService,
    public deviceInfo: DeviceInfoService,
    private commentNotificationService: CommentNotificationService,
    private startUpService: StartUpService,
    private brainstormingDataService: BrainstormingDataService,
  ) {}

  ngAfterViewInit() {
    this.headerService.initHeader(() => this);
    const observer = { next: () => this.refreshLocations() };
    this.sessionService.getRole().subscribe(observer);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(observer);
  }

  ngOnInit() {
    this.sessionService.onReady.subscribe(() => {
      this.init();
    });
  }

  init() {
    this.sessionService.getRole().subscribe((role) => {
      this.userRole = role;
      this.isInRouteWithRoles = this.sessionService.canChangeRoleOnRoute;
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
    this.userManagementService.getUser().subscribe((newUser) => {
      this.user = newUser;
      this.refreshLocations();
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
    this.startUpService.unreadMotds().subscribe((state) => {
      this.motdState = state;
    });
  }

  getClockCount() {
    return this._clockCount;
  }

  registerClock() {
    this._clockCount++;
  }

  unregisterClock() {
    this._clockCount--;
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
          this.openUserBonusTokenDialog();
        } else if (result === 'logout') {
          this.logoutUser();
        }
      });
    });
  }

  logoutUser() {
    this.userManagementService.logout();
  }

  goBack() {
    this.location.back();
  }

  startTour() {
    this.onboardingService.startDefaultTour(true);
  }

  login() {
    this.dialog.open(LoginComponent, {
      width: '350px',
    });
  }

  routeAdmin() {
    this.router.navigate(['/admin/create-motd']);
  }

  openDeleteUserDialog() {
    const dialogRef = this.dialog.open(DeleteAccountComponent, {
      width: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'abort') {
        return;
      } else if (result === 'delete') {
        this.userManagementService.deleteAccount();
      }
    });
  }

  openUserBonusTokenDialog() {
    const dialogRef = this.dialog.open(UserBonusTokenComponent, {
      width: '600px',
    });
    dialogRef.componentInstance.userId = this.user.id;
  }

  startUpFinished() {
    return this.sessionService.isReady;
  }

  /*Rescale*/

  /**
   * Access to static Rescale from AppComponent
   * returns Rescale from AppComponent
   */
  public getRescale(): Rescale {
    return AppComponent.rescale;
  }

  /*QR*/

  public getURL(): string {
    return `${location.origin}/participant/room/${this.room?.shortId}`;
  }

  public showQRDialog() {
    Rescale.requestFullscreen();
    const dialogRef = this.dialog.open(QrCodeDialogComponent, {
      panelClass: 'screenDialog',
    });
    dialogRef.componentInstance.data = this.getURL();
    dialogRef.componentInstance.key = this.room?.shortId;
    dialogRef.afterClosed().subscribe((res) => {
      Rescale.exitFullscreen();
    });
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
    const url = decodeURI(this.router.url);
    let newRoute = '/participant/';
    if (this.userRole !== this.user.role) {
      newRoute =
        this.user.role === UserRole.CREATOR ? '/creator/' : '/moderator/';
    }
    this.router.navigate([url.replace(/^\/[^\/]+\//gim, newRoute)]);
  }

  public navigateTopicCloud() {
    const url = decodeURI(this.router.url);
    if (RADAR_REGEX.test(url)) {
      return;
    }
    const data = url.match(ROOM_REGEX);
    this.eventService.broadcast('save-comment-filter');
    const confirmDialogRef = this.dialog.open(TopicCloudFilterComponent, {
      autoFocus: false,
      data: {
        filterObject: RoomDataFilter.loadFilter('commentList'),
      },
    });
    confirmDialogRef.componentInstance.target = `${data[1]}/room/${data[2]}/comments/tagcloud`;
    confirmDialogRef.componentInstance.userRole = this.userRole;
  }

  public navigateBrainstorming() {
    const confirmDialogRef = this.confirmDialog.open(
      TopicCloudBrainstormingComponent,
      {
        autoFocus: false,
      },
    );

    const data = decodeURI(this.router.url).match(ROOM_REGEX);
    confirmDialogRef.componentInstance.target = `${data[1]}/room/${data[2]}/comments/brainstorming`;
    confirmDialogRef.componentInstance.userRole = this.userRole;
  }

  public navigateBrainstormingDirectly() {
    this.router.navigate([
      this.router.url.split('/', 4).join('/') + '/comments/brainstorming',
    ]);
  }

  public getCurrentRoleIcon() {
    if (this.user?.isSuperAdmin) {
      return 'manage_accounts';
    } else if (this.user?.role === UserRole.EXECUTIVE_MODERATOR) {
      return 'support_agent';
    } else if (this.user?.role === UserRole.CREATOR) {
      return 'co_present';
    }
    return 'person';
  }

  public getCurrentRoleDescription(): string {
    if (this.user?.isSuperAdmin) {
      return 'tooltip-super-admin';
    } else if (this.user?.role === UserRole.EXECUTIVE_MODERATOR) {
      return 'tooltip-moderator';
    } else if (this.user?.role === UserRole.CREATOR) {
      return 'tooltip-creator';
    }
    return 'tooltip-participant';
  }

  public navigateToPage(location: PossibleLocation) {
    location.navigate(decodeURI(this.router.url));
  }

  refreshLocations() {
    const url = decodeURI(this.router.url);
    this.currentLocation = null;
    let anyTrue = false;
    this.possibleLocations.forEach((loc) => {
      loc.accessible = loc.canBeAccessedOnRoute(url);
      loc.active = loc.isCurrentRoute(url);
      if (loc.active) {
        this.currentLocation = loc;
      }
      if (loc.accessible) {
        anyTrue = true;
      }
    });
    this.possibleLocationsEmpty = !anyTrue;
  }
}
