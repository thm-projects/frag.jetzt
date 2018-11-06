import { Component, EventEmitter, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User;

  constructor(public location: Location,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              public router: Router,
              private translationService: TranslateService,
              private langService: LanguageService) {

    translationService.setDefaultLang(this.translationService.getBrowserLang());
    sessionStorage.setItem('currentLang', this.translationService.getBrowserLang());
  }

  ngOnInit() {
    // Subscribe to user data (update component's user when user data changes: e.g. login, logout)
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
    const role: UserRole = this.user !== undefined ? this.user.role : undefined;
    let route: string;

    switch (role) {
      case UserRole.PARTICIPANT:
        route = '/participant';
        break;
      case UserRole.CREATOR:
        route = '/creator';
        break;
      default:
        route = '/';
    }
    this.router.navigate([route]);
  }

  useLanguage(language: string) {
    this.translationService.use(language);
    sessionStorage.setItem('currentLang', this.translationService.currentLang);
    this.langService.langEmitter.emit(language);

  }
}
