import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {


  constructor(
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public router: Router
  ) { }

  ngOnInit() {
  }

  guestLogin(): void {
    this.authenticationService.guestLogin().subscribe(loginSuccessful => this.checkLogin(loginSuccessful));
  }

  private checkLogin(loginSuccessful: boolean) {
    if (loginSuccessful) {
      this.notificationService.show('Login successful!');
      this.router.navigate(['participant']);
    }
  }

}
