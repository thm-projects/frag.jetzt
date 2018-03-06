import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(public authenticationService: AuthenticationService, public router: Router, public notificationService: NotificationService) {
  }

  ngOnInit() {
  }

  login(username: string, password: string): void {
    username = username.trim();
    password = password.trim();

    if (username === '' || password === '') {
      // ToDo: Handle username and password not correct event
      console.log(`Username or password empty`);
    } else {
      this.authenticationService.login(username, password).subscribe(loginSuccessful => {
        console.log(loginSuccessful);
        if (loginSuccessful) {
          this.notificationService.show('Login successful!');
          this.router.navigate(['rooms']);
        } else {
          this.notificationService.show('Login failed!');
          this.router.navigate(['home']);
        }
      });
    }
  }

}
