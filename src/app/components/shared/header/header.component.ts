import { AfterViewInit, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { NavigationEnd, Router } from '@angular/router';
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
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { TagCloudMetaData } from '../../../services/util/tag-cloud-data.service';
import { WsRoomService } from '../../../services/websockets/ws-room.service';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { HeaderService } from '../../../services/util/header.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { WorkerConfigDialogComponent } from '../_dialogs/worker-config-dialog/worker-config-dialog.component';
import { ArsComposeHostDirective } from '../../../../../projects/ars/src/lib/compose/ars-compose-host.directive';
import { ThemeService } from '../../../../theme/theme.service';
import { RoleChecker } from '../../../utils/RoleChecker';

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
  shortId: string;
  isSafari = 'false';
  moderationEnabled: boolean;
  motdState = false;
  room: Room;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  commentsCountKeywords = 0;
  isAdminConfigEnabled = false;
  toggleUserActivity = false;
  userActivity = 0;
  deviceType = localStorage.getItem('deviceType');
  isInRouteWithRoles = false;
  private _subscriptionRoomService = null;

  constructor(public location: Location,
              private authenticationService: AuthenticationService,
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
              private wsRoomService: WsRoomService,
              private topicCloudAdminService: TopicCloudAdminService,
              private headerService: HeaderService,
              private onboardingService: OnboardingService,
              public themeService: ThemeService,
  ) {
  }

  ngAfterViewInit() {
    this.headerService.initHeader(() => this);
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        [this.userRole, this.isInRouteWithRoles] = RoleChecker.checkRole(e.url, this.user?.role);
      }
    });
    this.topicCloudAdminService.getAdminData.subscribe(data => {
      this.isAdminConfigEnabled = !TopicCloudAdminService.isTopicRequirementDisabled(data);
    });
    this.eventService.on<TagCloudMetaData>('tagCloudHeaderDataOverview').subscribe(data => {
      this.commentsCountQuestions = data.commentCount;
      this.commentsCountUsers = data.userCount;
      this.commentsCountKeywords = data.tagCount;
    });
    if (localStorage.getItem('loggedin') !== null && localStorage.getItem('loggedin') === 'true') {
      this.authenticationService.refreshLogin();
    }
    const userAgent = navigator.userAgent;
    // Check if mobile device
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      // Check if IOS device
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        this.isSafari = 'true';
      }
      this.deviceType = 'mobile';
    } else {
      // Check if Mac
      if (/Macintosh|MacIntel|MacPPC|Mac68k/.test(userAgent)) {
        // Check if Safari browser
        if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
          this.isSafari = 'true';
        }
      }
      this.deviceType = 'desktop';
    }
    localStorage.setItem('isSafari', this.isSafari);
    localStorage.setItem('deviceType', this.deviceType);
    if (!localStorage.getItem('currentLang')) {
      const lang = this.translationService.getBrowserLang();
      this.translationService.setDefaultLang(lang);
      localStorage.setItem('currentLang', lang);
    } else {
      this.translationService.setDefaultLang(localStorage.getItem('currentLang'));
    }
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);

    let time = new Date();
    this.getTime(time);
    setInterval(() => {
      time = new Date();
      this.getTime(time);
    }, 1000);

    this.router.events.subscribe(val => {
      /* the router will fire multiple events */
      /* we only want to react if it's the final active route */
      if (val instanceof NavigationEnd) {
        /* segments gets all parts of the url */
        const segments = this.router.parseUrl(this.router.url).root.children.primary.segments;
        this.shortId = '';
        this.room = null;
        if (this._subscriptionRoomService) {
          this._subscriptionRoomService.unsubscribe();
          this._subscriptionRoomService = null;
        }

        if (segments && segments.length > 2) {
          if (!segments[2].path.includes('%')) {
            this.shortId = segments[2].path;
            localStorage.setItem('shortId', this.shortId);
            this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
              this.room = room;
              this.moderationEnabled = !room.directSend;
              this._subscriptionRoomService = this.wsRoomService.getRoomStream(this.room.id).subscribe(msg => {
                const message = JSON.parse(msg.body);
                if (message.type === 'RoomPatched') {
                  this.room.questionsBlocked = message.payload.changes.questionsBlocked;
                  this.moderationEnabled = !message.payload.changes.directSend;
                }
              });
            });
          }
        }
      }
    });
    this.moderationEnabled = localStorage.getItem('moderationEnabled') === 'true';


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
    const hh = ('0' + time.getHours()).substr(-2);
    const mm = ('0' + time.getMinutes()).substr(-2);
    this.cTime = hh + ':' + mm;
  }

  logout() {
    // ToDo: Fix this madness.
    if (this.user.authProvider === 'ARSNOVA_GUEST') {
      this.bonusTokenService.getTokensByUserId(this.user.id).subscribe(list => {
        if (list && list.length > 0) {
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
        } else {
          this.logoutUser();
        }
      });
    } else {
      this.logoutUser();
    }
  }

  logoutUser() {
    this.authenticationService.logout();
    this.translationService.get('header.logged-out').subscribe(message => {
      this.notificationService.show(message);
    });
    this.navToHome();
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
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${this.shortId}`;
  }

  public showQRDialog() {
    Rescale.requestFullscreen();
    const dialogRef = this.dialog.open(QrCodeDialogComponent, {
      panelClass: 'screenDialog'
    });
    dialogRef.componentInstance.data = this.getURL();
    dialogRef.componentInstance.key = this.shortId;
    dialogRef.afterClosed().subscribe(res => {
      Rescale.exitFullscreen();
    });
  }

  public navigateQuestionBoard() {
    this.eventService.broadcast('navigate', 'questionBoard');
  }

  public navigateRoomBonusToken() {
    this.eventService.broadcast('navigate', 'roomBonusToken');
  }

  public navigateModerator() {
    this.eventService.broadcast('navigate', 'moderator');
  }

  public navigateTags() {
    this.eventService.broadcast('navigate', 'tags');
  }

  public navigateExportQuestions() {
    this.eventService.broadcast('navigate', 'exportQuestions');
  }

  public navigateDeleteQuestions() {
    this.eventService.broadcast('navigate', 'deleteQuestions');
  }

  public navigateCreateQuestion() {
    this.eventService.broadcast('navigate', 'createQuestion');
  }

  public navigateDeleteRoom() {
    this.eventService.broadcast('navigate', 'deleteRoom');
  }

  public navigateProfanityFilter() {
    this.eventService.broadcast('navigate', 'profanityFilter');
  }

  public navigateEditSessionDescription() {
    this.eventService.broadcast('navigate', 'editSessionDescription');
  }

  public navigateModeratorSettings() {
    this.eventService.broadcast('navigate', 'moderatorSettings');
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
    const confirmDialogRef = this.confirmDialog.open(TopicCloudFilterComponent, {
      autoFocus: false
    });
    confirmDialogRef.componentInstance.target = this.router.url + '/tagcloud';
    confirmDialogRef.componentInstance.userRole = this.userRole;
  }

  public navigateTopicCloudConfig() {
    this.eventService.broadcast('navigate', 'topicCloudConfig');
  }

  public navigateTopicCloudAdministration() {
    this.eventService.broadcast('navigate', 'topicCloudAdministration');
  }

  public blockQuestions() {
    // flip state if clicked
    this.room.questionsBlocked = !this.room.questionsBlocked;
    this.roomService.updateRoom(this.room).subscribe();
  }

  public startWorkerDialog() {
    WorkerConfigDialogComponent.addTask(this.dialog, this.room);
  }
}
