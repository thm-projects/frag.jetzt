import { Language, LanguageService } from '../../../services/util/language.service';
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
import { DeviceInfoService } from '../../../services/util/device-info.service';

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
  public themes: Theme[];

  constructor(
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog,
    private translateService: TranslateService,
    public langService: LanguageService,
    public authenticationService: AuthenticationService,
    public themeService: ThemeService,
    private styleService: StyleService,
    private motdService: MotdService,
    public deviceInfo: DeviceInfoService,
  ) {
    langService.getLanguage().subscribe(lang => translateService.use(lang));
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
        dialogRef.componentInstance.motdsList = e;
      });
    });
    this.translateService.get('footer.open').subscribe(message => {
      this.open = message;
    });
    this.themes = this.themeService.getThemes();
    this.updateScale(this.themeService.currentTheme.getScale(this.deviceInfo.isCurrentlyMobile ? 'mobile' : 'desktop'));

    if (localStorage.getItem('cookieAccepted') !== 'true') {
      this.showCookieModal();
    }
  }

  showDemo() {
    this.dialog.open(DemoVideoComponent, {
      width: '80%',
      maxWidth: '600px'
    });
  }

  showCookieModal() {
    const dialogRef = this.dialog.open(CookiesComponent, {
      width: '80%',
      maxWidth: '600px',
      autoFocus: true

    });
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        this.showOverlay();
      }
    });
  }

  showImprint() {
    this.dialog.open(ImprintComponent, {
      width: '80%',
      maxWidth: '600px'
    });
  }

  showDataProtection() {
    this.dialog.open(DataProtectionComponent, {
      width: '80%',
      maxWidth: '600px'
    });

  }

  showOverlay() {
    const dialogRef = this.dialog.open(OverlayComponent, {});
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe(res => {
      if (res && localStorage.getItem('cookieAccepted') !== 'true') {
        this.showCookieModal();
      }
    });
  }

  useLanguage(language: Language) {
    this.translateService.use(language);
    this.langService.setLanguage(language);
  }

  changeTheme(theme: Theme) {
    this.themeService.activate(theme.key);
    this.updateScale(theme.getScale(this.deviceInfo.isCurrentlyMobile ? 'mobile' : 'desktop'));
  }

  updateScale(scale: number) {
    AppComponent.rescale.setInitialScale(scale);
    AppComponent.rescale.setDefaultScale(scale);
  }

  openMenu() {
    if (this.langService.currentLanguage() === 'de') {
      this.langaugeMenu._allItems.get(0).focus();
    } else if (this.langService.currentLanguage() === 'en') {
      this.langaugeMenu._allItems.get(1).focus();
    }
  }
}
