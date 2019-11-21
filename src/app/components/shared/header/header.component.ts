import { Component, OnInit, Renderer2 } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material';
import { LoginComponent } from '../login/login.component';
import { DeleteAccountComponent } from '../_dialogs/delete-account/delete-account.component';
import { UserService } from '../../../services/http/user.service';
import { EventService } from '../../../services/util/event.service';
import { AppComponent } from '../../../app.component';
import { Rescale } from '../../../models/rescale';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { UserBonusTokenComponent } from '../_dialogs/user-bonus-token/user-bonus-token.component';
import { QrCodeDialogComponent } from '../_dialogs/qr-code-dialog/qr-code-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User;
  cTime: string;
  shortId: string;
  deviceType: string;
  moderationEnabled: boolean;

  constructor(public location: Location,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              public router: Router,
              private translationService: TranslateService,
              public dialog: MatDialog,
              private userService: UserService,
              public eventService: EventService,
              private _r: Renderer2
  ) {
  }

  ngOnInit() {
    if (localStorage.getItem('loggedin') !== null && localStorage.getItem('loggedin') === 'true') {
      this.authenticationService.refreshLogin();
    }
    // Subscribe to user data (update component's user when user data changes: e.g. login, logout)
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.deviceType = 'mobile';
    } else {
      this.deviceType = 'desktop';
    }
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
        const roomIdRegExp = new RegExp('^[0-9]{8}$');
        segments.forEach(element => {
          /* searches the url segments for a short id */
          if (roomIdRegExp.test(element.path)) {
            this.shortId = element.path;
          }
        });
      }
    });
    this.moderationEnabled = (localStorage.getItem('moderationEnabled') === 'true') ? true : false;

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
  }

  getTime(time: Date) {
    const hh = ('0' + time.getHours()).substr(-2);
    const mm = ('0' + time.getMinutes()).substr(-2);
    this.cTime = hh + ':' + mm;
  }

  logout() {
    this.authenticationService.logout();
    this.translationService.get('header.logged-out').subscribe(message => {
      this.notificationService.show(message);
    });
    this.navToHome();
  }

  goBack() {
    this.location.back();
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

  public getQRCode(): string {
    return 'https://frag.jetzt/participant/room/' + this.shortId;
  }

  public showQRDialog() {
    Rescale.requestFullscreen();
    const dialogRef = this.dialog.open(QrCodeDialogComponent, {
      panelClass: 'screenDialog'
    });
    const qrDialog: QrCodeDialogComponent = dialogRef.componentInstance;
    qrDialog.setQRCode(this.getQRCode());
    dialogRef.afterClosed().subscribe(res => {
      Rescale.exitFullscreen();
    });
  }

}
