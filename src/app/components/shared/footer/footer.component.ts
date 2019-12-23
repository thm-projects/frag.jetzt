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
import { OverlayComponent } from '../../home/_dialogs/overlay/overlay.component';
import { AppComponent } from '../../../app.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  public demoId = '22424050';

  public room: Room;
  public user: User;

  public open: string;
  public deviceType: string;
  public cookieAccepted: boolean;
  public dataProtectionConsent: boolean;

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
    if (!this.themeService.getTheme()['source']['_value']) {
      if (this.deviceType === 'mobile') {
        this.themeService.activate('dark');
        this.themeClass = 'dark';
      } else {
        this.themeService.activate('arsnova');
        this.themeClass = 'arsnova';
      }
    }
    this.translateService.use(localStorage.getItem('currentLang'));
    this.translateService.get('footer.open').subscribe(message => {
      this.open = message;
    });
    this.themes = this.themeService.getThemes();
    this.updateScale(this.themeService.getThemeByKey(this.themeClass));
    this.cookieAccepted = localStorage.getItem('cookieAccepted') === 'true';
    this.dataProtectionConsent = localStorage.getItem('dataProtectionConsent') === 'true';

    if (!localStorage.getItem('cookieAccepted')) {
      this.showCookieModal();
    } else {
      if (!this.cookieAccepted || !this.dataProtectionConsent) {
        this.showOverlay();
      }
    }
  }

  showDemo() {
    const dialogRef = this.dialog.open(DemoVideoComponent, {
      width: '80%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
    dialogRef.afterOpened().subscribe(e => {
      document.getElementById('outer_main_container').style.display = 'none';
    });
    dialogRef.afterClosed().subscribe(e => {
      document.getElementById('outer_main_container').style.display = 'block';
    });

  }

  showCookieModal() {
    const dialogRef = this.dialog.open(CookiesComponent, {
      width: '80%',
      autoFocus: true

    });
    dialogRef.disableClose = true;
    dialogRef.componentInstance.deviceType = this.deviceType;
    dialogRef.afterClosed().subscribe(res => {
      this.cookieAccepted = res;
      this.dataProtectionConsent = res;
      if (!res) {
        this.showOverlay();
      }
    });
  }

  showImprint() {
    const dialogRef = this.dialog.open(ImprintComponent, {
      width: '80%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showHelp() {
    const dialogRef = this.dialog.open(HelpPageComponent, {
      width: '80%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showDataProtection() {
    const dialogRef = this.dialog.open(DataProtectionComponent, {
      width: '80%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;

  }

  showOverlay() {
    const dialogRef = this.dialog.open(OverlayComponent, {});
    dialogRef.componentInstance.deviceType = this.deviceType;
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        if (!this.cookieAccepted) {
          this.showCookieModal();
        } else if (!this.dataProtectionConsent) {
          this.showDataProtection();
        }
      }
    });
  }

  useLanguage(language: string) {
    this.translateService.use(language);
    localStorage.setItem('currentLang', language);
    this.langService.langEmitter.emit(language);
  }

  changeTheme(theme: Theme) {
    this.themeClass = theme.key;
    this.themeService.activate(theme.key);
    this.updateScale(theme);
  }

  updateScale(theme: Theme) {
    AppComponent.rescale.setInitialScale(theme.scale);
    AppComponent.rescale.setDefaultScale(theme.scale);
  }

  getLanguage(): string {
    return localStorage.getItem('currentLang');
  }
}
