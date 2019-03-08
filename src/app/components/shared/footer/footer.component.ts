import { LanguageService } from './../../../services/util/language.service';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  blogUrl = 'https://arsnova.thm.de/blog/';
  dsgvoUrl = 'https://arsnova.thm.de/blog/datenschutzerklaerung/';
  imprUrl = 'https://arsnova.thm.de/blog/impressum/';

  open: string;

  constructor(public notificationService: NotificationService,
              public router: Router,
              public dialog: MatDialog,
              private translateService: TranslateService,
              private langService: LanguageService) {
                langService.langEmitter.subscribe(lang => translateService.use(lang));
              }

  ngOnInit() {
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

}
