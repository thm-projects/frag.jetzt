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

  protected usernameErrorMessage = '';
  protected passwordErrorMessage = '';

  constructor(public authenticationService: AuthenticationService,
              public router: Router,
              public notificationService: NotificationService) {
  }

  ngOnInit() {
  }

  login(username: string, password: string): void {
    username = username.trim();
    password = password.trim();

    if (username === '') {
      // ToDo: Handle username and password not correct event
      this.usernameErrorMessage = 'Username is required';
    } else if (password === '') {
      this.passwordErrorMessage = 'Password is required';
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
