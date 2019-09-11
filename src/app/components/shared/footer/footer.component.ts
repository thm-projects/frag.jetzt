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
import { ImprintComponent } from '../../home/_dialogs/imprint/imprint.component';
import { HelpPageComponent } from '../_dialogs/help-page/help-page.component';
import { DataProtectionComponent } from '../../home/_dialogs/data-protection/data-protection.component';
import { Theme } from '../../../../theme/Theme';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  public demoId = '78844652';

  public room: Room;
  public user: User;

  public open: string;
  public deviceType: string;

  public themeClass = localStorage.getItem('theme');

  public themes: Theme[];

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
    this.themes = this.themeService.getThemes();

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
    width: '95%',
    autoFocus: false
  });
  dialogRef.disableClose = true;
  dialogRef.componentInstance.deviceType = this.deviceType;
}

showImprint() {
  const dialogRef = this.dialog.open(ImprintComponent, {
    height: '95%',
    width: '95%'
  });
  dialogRef.componentInstance.deviceType = this.deviceType;
}

showHelp() {
  const dialogRef = this.dialog.open(HelpPageComponent, {
    height: '95%',
    width: '95%'
  });
  dialogRef.componentInstance.deviceType = this.deviceType;
}

showDataProtection() {
  const dialogRef = this.dialog.open(DataProtectionComponent, {
    height: '95%',
    width: '95%'
  });
  dialogRef.componentInstance.deviceType = this.deviceType;
}

useLanguage(language: string) {
  this.translateService.use(language);
  localStorage.setItem('currentLang', language);
  this.langService.langEmitter.emit(language);
}

changeTheme(theme: Theme) {
  this.themeClass = theme.name;
  this.themeService.activate(theme.name);
}
}
