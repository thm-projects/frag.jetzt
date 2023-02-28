import {
  AfterViewInit,
  Component,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
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
import { Theme } from 'theme/Theme';
import { MatMenu } from '@angular/material/menu';
import { LanguageService } from 'app/services/util/language.service';
import {
  getBrainstormingURL,
  livepollNavigationAccessOnRoute,
  navigateBrainstorming,
  navigateTopicCloud,
} from '../navigation/navigation.component';
import { LivepollCreateComponent } from '../_dialogs/livepoll-create/livepoll-create.component';
import { PseudonymEditorComponent } from '../_dialogs/pseudonym-editor/pseudonym-editor.component';
import { CommentNotificationDialogComponent } from '../_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { GPTUserDescriptionDialogComponent } from '../_dialogs/gptuser-description-dialog/gptuser-description-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChild(ArsComposeHostDirective) host: ArsComposeHostDirective;
  @ViewChild('themeMenu') themeMenu: MatMenu;
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
  themes: Theme[];
  public readonly navigationAccess = {
    livepoll: livepollNavigationAccessOnRoute,
  };
  private _clockCount = 0;

  constructor(
    public userManagementService: UserManagementService,
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
    public deviceInfo: DeviceInfoService,
    private commentNotificationService: CommentNotificationService,
    private startUpService: StartUpService,
    private brainstormingDataService: BrainstormingDataService,
    public langService: LanguageService,
  ) {}

  ngAfterViewInit() {
    this.headerService.initHeader(() => this);
    this.themes = this.themeService.getThemes();
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
          UserBonusTokenComponent.openDialog(this.dialog, this.user?.id);
        } else if (result === 'logout') {
          this.logoutUser();
        }
      });
    });
  }

  logoutUser() {
    this.userManagementService.logout();
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
    this.router.navigate(['/admin/overview']);
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
    const url = decodeURI(this.router.url);
    let newRoute = '/participant/';
    if (this.userRole !== this.user.role) {
      newRoute =
        this.user.role === UserRole.CREATOR ? '/creator/' : '/moderator/';
    }
    this.router.navigate([url.replace(/^\/[^\/]+\//gim, newRoute)]);
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

  openMenu() {
    const active = this.themeService.activeTheme.key;
    const index = this.themes.findIndex((theme) => theme.key === active);
    if (index < 0) {
      return;
    }
    this.themeMenu._allItems.get(index).focus();
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

  openGPTUser() {
    GPTUserDescriptionDialogComponent.open(this.dialog, this.room.id);
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

  openLivepollDialog() {
    LivepollCreateComponent.create(this.dialog);
  }
}
