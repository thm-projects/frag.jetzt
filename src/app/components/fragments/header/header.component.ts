import { Component, OnInit } from '@angular/core';
import { UserRole } from '../../../models/user-roles.enum';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { NotificationService } from '../../../services/util/notification.service';
import { Router } from '@angular/router';
import { User } from '../../../models/user';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User;

  constructor(private authenticationService: AuthenticationService,
              private notification: NotificationService,
              public router: Router) {
  }

  ngOnInit() {
    // Subscribe to user data
    this.authenticationService.watchUser.subscribe(newUser  => this.user = newUser);
  }

  logout() {
    this.authenticationService.logout();
    this.notification.show(`Logged out`);
    this.router.navigate(['/']);
  }
}
