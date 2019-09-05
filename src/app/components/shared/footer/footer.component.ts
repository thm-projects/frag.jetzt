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
import { ImprintComponent } from '../imprint/imprint.component';
import { DataProtectionComponent } from '../data-protection/data-protection.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  blogUrl = 'https://arsnova.thm.de/blog/';
  dsgvoUrl = 'https://arsnova.thm.de/blog/datenschutzerklaerung/';
  imprUrl = 'https://arsnova.thm.de/blog/impressum/';
  demoId = '78844652';

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
  }

  navToBlog() {
    this.translateService.get('footer.will-open').subscribe(message => {
      this.notificationService.show('Blog' + message, this.open, {
        duration: 4000
      });
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.blogUrl, '_blank');
      }
    });
  }

  // check if still needed
  navToDSGVO() {
    this.translateService.get('footer.will-open').subscribe(message => {
      this.translateService.get('footer.dsgvo').subscribe(what => {
        this.notificationService.show(what + message, this.open, {
          duration: 4000
        });
      });
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.dsgvoUrl, '_blank');
      }
    });
  }

  showDSGVO() {
    const dialogRef = this.dialog.open(DataProtectionComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '95%',
      width: '50%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  // check if still needed
  navToImprint() {
    this.translateService.get('footer.will-open').subscribe(message => {
      this.translateService.get('footer.imprint').subscribe(what => {
        this.notificationService.show(what + message, this.open, {
          duration: 4000
        });
      });
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.imprUrl, '_blank');
      }
    });
  }

  showImprint() {
    const dialogRef = this.dialog.open(ImprintComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '95%',
      width: '50%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
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
