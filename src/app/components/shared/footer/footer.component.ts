import { LanguageService } from './../../../services/util/language.service';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { DemoVideoComponent } from '../../home/_dialogs/demo-video/demo-video.component';
import { ThemeService } from '../../../../theme/theme.service';
import { CookiesComponent } from '../../home/_dialogs/cookies/cookies.component';
import { ImprintComponent } from '../imprint/imprint.component';
import { HelpPageComponent } from '../help-page/help-page.component';
import { DataProtectionComponent } from '../data-protection/data-protection.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  room: Room;
  user: User;

  open: string;
  deviceType: string;

  themeClass = localStorage.getItem('theme');

  constructor(public notificationService: NotificationService,
              public router: Router,
              public dialog: MatDialog,
              private translateService: TranslateService,
              private langService: LanguageService,
              public authenticationService: AuthenticationService,
              private themeService: ThemeService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.deviceType = localStorage.getItem('deviceType');
    this.translateService.use(localStorage.getItem('currentLang'));
    this.translateService.get('footer.open').subscribe(message => {
      this.open = message;
    });

    if (!localStorage.getItem('cookieAccepted')) {
      this.showCookieModal();
    }

  }

  showDemo() {
    const dialogRef = this.dialog.open(DemoVideoComponent, {
      position: {
        left: '10px',
        right: '10px'
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showCookieModal() {
    const dialogRef = this.dialog.open(CookiesComponent, {
      height: '95%',
      width: '60%'
    });
    dialogRef.disableClose = true;
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showImprint() {
    const dialogRef = this.dialog.open(ImprintComponent, {
      height: '95%',
      width: '75%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showHelp() {
    const dialogRef = this.dialog.open(HelpPageComponent, {
      height: '95%',
      width: '75%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showDataProtection() {
    const dialogRef = this.dialog.open(DataProtectionComponent, {
      height: '95%',
      width: '75%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  useLanguage(language: string) {
    this.translateService.use(language);
    localStorage.setItem('currentLang', language);
    this.langService.langEmitter.emit(language);
  }

  changeTheme(theme) {
    this.themeClass = theme;
    this.themeService.activate(theme);
  }
}
