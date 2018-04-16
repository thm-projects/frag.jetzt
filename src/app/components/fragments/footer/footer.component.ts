import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { FooterLoginDialogComponent } from '../../dialogs/footer-login-dialog/footer-login-dialog.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  guestLogin(): void {
    this.authenticationService.guestLogin().subscribe(loginSuccessful => this.checkLogin(loginSuccessful));
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(FooterLoginDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if(result === 'login'){this.guestLogin();}
      });
  }

  private checkLogin(loginSuccessful: boolean) {
    if (loginSuccessful) {
      this.notificationService.show('Login successful!');
      this.router.navigate(['participant']);
    }
  }
}
