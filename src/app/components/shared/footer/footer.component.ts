import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
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
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  navToBlog() {
    window.open(this.blogUrl, '_blank');
  }
  navToDSGVO() {
    window.open(this.dsgvoUrl, '_blank');
  }
  navToImprint() {
    window.open(this.imprUrl, '_blank');
  }

}
