import { AfterViewInit, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { User } from '../../../models/user';
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
import { MotdService } from '../../../services/http/motd.service';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { TagCloudDataService } from '../../../services/util/tag-cloud-data.service';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { HeaderService } from '../../../services/util/header.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { ArsComposeHostDirective } from '../../../../../projects/ars/src/lib/compose/ars-compose-host.directive';
import { ThemeService } from '../../../../theme/theme.service';
import {
  TopicCloudBrainstormingComponent
} from '../_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { SessionService } from '../../../services/util/session.service';
import { LanguageService } from '../../../services/util/language.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { CommentNotificationService } from '../../../services/http/comment-notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChild(ArsComposeHostDirective) host: ArsComposeHostDirective;
  user: User;
  userRole: UserRole;
  cTime: string;
  motdState = false;
  room: Room;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  commentsCountKeywords = 0;
  isAdminConfigEnabled = false;
  toggleUserActivity = false;
  userActivity = '?';
  isInRouteWithRoles = false;
  hasEmailNotifications = false;
  hasKeywords = false;

  constructor(
    public location: Location,
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public router: Router,
    public translationService: TranslateService,
    public dialog: MatDialog,
    private userService: UserService,
    public eventService: EventService,
    private bonusTokenService: BonusTokenService,
    private _r: Renderer2,
    private motdService: MotdService,
    private confirmDialog: MatDialog,
    private roomService: RoomService,
    private topicCloudAdminService: TopicCloudAdminService,
    private headerService: HeaderService,
    private onboardingService: OnboardingService,
    public themeService: ThemeService,
    public sessionService: SessionService,
    public tagCloudDataService: TagCloudDataService,
    private languageService: LanguageService,
    public deviceInfo: DeviceInfoService,
    private commentNotificationService: CommentNotificationService,
  ) {
    this.languageService.getLanguage().subscribe(lang => this.translationService.use(lang));
  }

  ngAfterViewInit() {
    this.headerService.initHeader(() => this);
  }

  ngOnInit() {
    this.sessionService.getRole().subscribe(role => {
      this.userRole = role;
      this.isInRouteWithRoles = this.sessionService.canChangeRoleOnRoute;
    });
    this.topicCloudAdminService.getAdminData.subscribe(data => {
      this.isAdminConfigEnabled = !TopicCloudAdminService.isTopicRequirementDisabled(data);
    });
    this.tagCloudDataService.getMetaData().subscribe(data => {
      if (!data) {
        return;
      }
      this.commentsCountQuestions = data.commentCount;
      this.commentsCountUsers = data.userCount;
      this.commentsCountKeywords = data.tagCount;
    });
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);

    let time = new Date();
    this.getTime(time);
    setInterval(() => {
      time = new Date();
      this.getTime(time);
    }, 1000);

    this.sessionService.getRoom().subscribe(room => {
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
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit2) === true && this.eventService.focusOnInput === false) {
        if (this.user) {
          document.getElementById('session-button').focus();
        } else {
          document.getElementById('login-button').focus();
        }
      }
    });
    this.motdService.onNewMessage().subscribe(state => {
      this.motdState = state;
    });

    this.headerService.onActivityChange(e => {
      this.toggleUserActivity = e;
    });
    this.headerService.onUserChange(e => {
      this.userActivity = e;
    });
  }

  showMotdDialog() {
    this.motdService.requestDialog();
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
    this.bonusTokenService.getTokensByUserId(this.user.id).subscribe(list => {
      if (!list || list.length < 1) {
        this.logoutUser();
        return;
      }
      const dialogRef = this.dialog.open(RemindOfTokensComponent, {
        width: '600px'
      });
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'abort') {
            this.openUserBonusTokenDialog();
          } else if (result === 'logout') {
            this.logoutUser();
          }
        });
    });
  }

  logoutUser() {
    this.authenticationService.logout();
    this.translationService.get('header.logged-out').subscribe(message => {
      this.notificationService.show(message);
    });
    if (SessionService.needsUser(this.router)) {
      this.navToHome();
    }
  }

  goBack() {
    this.location.back();
  }

  startTour() {
    this.onboardingService.startDefaultTour(true);
  }

  login(isLecturer: boolean) {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '350px'
    });
    dialogRef.componentInstance.role = (isLecturer === true) ? UserRole.CREATOR : UserRole.PARTICIPANT;
    dialogRef.componentInstance.isStandard = true;
  }

  navToHome() {
    this.router.navigate(['/']);
  }

  deleteAccount(id: string) {
    this.userService.delete(id).subscribe();
    this.authenticationService.logout();
    this.translationService.get('header.account-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
    this.navToHome();
  }

  openDeleteUserDialog() {
    const dialogRef = this.dialog.open(DeleteAccountComponent, {
      width: '600px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        } else if (result === 'delete') {
          this.deleteAccount(this.user.id);
        }
      });
  }

  openUserBonusTokenDialog() {
    const dialogRef = this.dialog.open(UserBonusTokenComponent, {
      width: '600px'
    });
    dialogRef.componentInstance.userId = this.user.id;
  }

  cookiesDisabled(): boolean {
    return localStorage.getItem('cookieAccepted') === 'false';
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
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${this.room?.shortId}`;
  }

  public showQRDialog() {
    Rescale.requestFullscreen();
    const dialogRef = this.dialog.open(QrCodeDialogComponent, {
      panelClass: 'screenDialog'
    });
    dialogRef.componentInstance.data = this.getURL();
    dialogRef.componentInstance.key = this.room?.shortId;
    dialogRef.afterClosed().subscribe(res => {
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
      next: value => this.hasEmailNotifications = !!value?.length
    });
  }

  public navigateToOtherView() {
    const url = decodeURI(this.router.url);
    let newRoute = '/participant/';
    if (this.userRole !== this.user.role) {
      newRoute = this.user.role === UserRole.CREATOR ? '/creator/' : '/moderator/';
    }
    this.router.navigate([url.replace(/^\/[^\/]+\//gmi, newRoute)]);
  }

  public navigateTopicCloud() {
    this.eventService.broadcast('navigate', 'topic-cloud');
  }

  public navigateBrainstorming() {
    const confirmDialogRef = this.confirmDialog.open(TopicCloudBrainstormingComponent, {
      autoFocus: false
    });
    confirmDialogRef.componentInstance.target = this.router.url + '/brainstorming';
    confirmDialogRef.componentInstance.userRole = this.userRole;
  }

  public getCurrentRoleIcon() {
    if (this.authenticationService.isSuperAdmin) {
      return 'manage_accounts';
    } else if (this.user?.role === UserRole.EXECUTIVE_MODERATOR) {
      return 'gavel';
    } else if (this.user?.role === UserRole.CREATOR) {
      return 'co_present';
    }
    return 'person';
  }

  public getCurrentRoleDescription(): string {
    if (this.authenticationService.isSuperAdmin) {
      return 'tooltip-super-admin';
    } else if (this.user?.role === UserRole.EXECUTIVE_MODERATOR) {
      return 'tooltip-moderator';
    } else if (this.user?.role === UserRole.CREATOR) {
      return 'tooltip-creator';
    }
    return 'tooltip-participant';
  }
}
