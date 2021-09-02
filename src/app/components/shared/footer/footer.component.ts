import { LanguageService } from '../../../services/util/language.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { Room } from '../../../models/room';
import { DemoVideoComponent } from '../../home/_dialogs/demo-video/demo-video.component';
import { ThemeService } from '../../../../theme/theme.service';
import { CookiesComponent } from '../../home/_dialogs/cookies/cookies.component';
import { ImprintComponent } from '../../home/_dialogs/imprint/imprint.component';
import { DataProtectionComponent } from '../../home/_dialogs/data-protection/data-protection.component';
import { Theme } from '../../../../theme/Theme';
import { OverlayComponent } from '../../home/_dialogs/overlay/overlay.component';
import { AppComponent } from '../../../app.component';
import { StyleService } from '../../../../../projects/ars/src/lib/style/style.service';
import { MotdService } from '../../../services/http/motd.service';
import { MotdDialogComponent } from '../_dialogs/motd-dialog/motd-dialog.component';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  @ViewChild('langMenu') langaugeMenu: MatMenu;

  public demoId = 'Feedback';

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
              private themeService: ThemeService,
              private styleService: StyleService,
              private motdService: MotdService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.motdService.onDialogRequest().subscribe(() => {
      this.motdService.getList().subscribe(e => {
        const dialogRef = this.dialog.open(MotdDialogComponent, {
          width: '80%',
          maxWidth: '600px',
          minHeight: '95%',
          height: '95%',
        });
        dialogRef.componentInstance.onClose.subscribe(() => {
          this.motdService.checkNewMessage();
        });
        dialogRef.componentInstance.motdsList = e;
      });
    });
    this.deviceType = localStorage.getItem('deviceType');
    this.styleService.setColor(this.themeService.getThemeByKey(this.themeClass).isDark);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.translateService.get('footer.open').subscribe(message => {
      this.open = message;
    });
    this.themes = this.themeService.getThemes();
    this.updateScale(this.themeService.getThemeByKey(this.themeClass).getScale(this.deviceType));
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
      width: '80%',
      maxWidth: '600px'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showCookieModal() {
    const dialogRef = this.dialog.open(CookiesComponent, {
      width: '80%',
      maxWidth: '600px',
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
      width: '80%',
      maxWidth: '600px'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  showDataProtection() {
    const dialogRef = this.dialog.open(DataProtectionComponent, {
      width: '80%',
      maxWidth: '600px'
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
    this.updateScale(theme.getScale(this.deviceType));
    this.styleService.setColor(theme.isDark);
  }

  updateScale(scale: number) {
    AppComponent.rescale.setInitialScale(scale);
    AppComponent.rescale.setDefaultScale(scale);
  }

  getLanguage(): string {
    return localStorage.getItem('currentLang');
  }

  openMenu() {
    if (this.getLanguage() === 'de') {
      this.langaugeMenu._allItems.get(0).focus();
    } else if (this.getLanguage() === 'en') {
      this.langaugeMenu._allItems.get(1).focus();
    }
  }
}
