import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { MatDialog } from '@angular/material';
import { LoginComponent } from '../login/login.component';
import { ThemeService } from '../../../../theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User;
  themeClass = localStorage.getItem('theme');
  cTime: string;
  shortId: string;
  deviceType = localStorage.getItem('deviceType');

  constructor(public location: Location,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              public router: Router,
              private translationService: TranslateService,
              private langService: LanguageService,
              public dialog: MatDialog,
              private themeService: ThemeService
  ) {
  }

  ngOnInit() {
    // Subscribe to user data (update component's user when user data changes: e.g. login, logout)
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
    this.router.navigate(['/']);
  }

  goBack() {
    this.location.back();
  }

  useLanguage(language: string) {
    this.translationService.use(language);
    localStorage.setItem('currentLang', language);
    this.langService.langEmitter.emit(language);
  }

  changeTheme(theme) {
    this.themeClass = theme;
    this.themeService.activate(theme);
  }

  login(isLecturer: boolean) {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '350px'
    });
    dialogRef.componentInstance.role = (isLecturer === true) ? UserRole.CREATOR : UserRole.PARTICIPANT;
    dialogRef.componentInstance.isStandard = true;
  }

}
