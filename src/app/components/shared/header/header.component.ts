import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
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
  themeClass = localStorage.getItem('classNameOfTheme');

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

  goToHomepage() {
    this.router.navigate(['/home']);
  }

  useLanguage(language: string) {
    this.translationService.use(language);
    localStorage.setItem('currentLang', language);
    this.langService.langEmitter.emit(language);
  }

  changeTheme(theme) {
    this.themeClass = theme;
    localStorage.setItem('classNameOfTheme', theme);
    if (theme === '') {
      this.themeService.setActiveThem('arsnovaTheme');
    } else {
      this.themeService.setActiveThem(theme);
    }
  }

  login(isLecturer: boolean) {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '350px'
    });
    dialogRef.componentInstance.role = (isLecturer === true) ? UserRole.CREATOR : UserRole.PARTICIPANT;
    dialogRef.componentInstance.isStandard = true;
  }

}
