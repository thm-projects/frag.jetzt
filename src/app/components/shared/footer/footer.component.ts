import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  blogUrl = 'https://arsnova.thm.de/blog/';
  dsgvoUrl = 'https://arsnova.thm.de/blog/datenschutzerklaerung/';
  imprUrl = 'https://arsnova.thm.de/blog/impressum/';
  constructor(
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  navToBlog() {
    this.notificationService.show('Der Blog wird in einem neuen Fenster geöffnet..', 'Öffnen' , {
      duration: 5000
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.blogUrl, '_blank');
      }
    });
  }
  navToDSGVO() {
    this.notificationService.show('Die Datenschutzverordnung wird in einem neuen Fenster geöffnet..', 'Öffnen' , {
      duration: 5000
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.dsgvoUrl, '_blank');
      }
    });
  }
  navToImprint() {
    this.notificationService.show('Das Impressum wird in einem neuen Fenster geöffnet..', 'Öffnen' , {
      duration: 5000
    });
    this.notificationService.snackRef.afterDismissed().subscribe(info => {
      if (info.dismissedByAction === true) {
        window.open(this.imprUrl, '_blank');
      }
    });
  }

}
