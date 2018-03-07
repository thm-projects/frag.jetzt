import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';
import { ErrorStateMatcher } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '../user-roles.enum';

export class LoginErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  @Input() role: UserRole;

  usernameFormControl = new FormControl('', [Validators.required]);
  passwordFormControl = new FormControl('', [Validators.required]);

  matcher = new LoginErrorStateMatcher();

  constructor(public authenticationService: AuthenticationService,
              public router: Router,
              public notificationService: NotificationService) {
  }

  ngOnInit() {
  }

  login(username: string, password: string): void {
    username = username.trim();
    password = password.trim();

    if (username !== '' && password !== '') {
      this.authenticationService.login(username, password, this.role).subscribe(loginSuccessful => this.checkLogin(loginSuccessful));
    } else {
      this.notificationService.show('Login failed!');
    }
  }

  private checkLogin(loginSuccessful: boolean) {
    if (loginSuccessful) {
      this.notificationService.show('Login successful!');
      if (this.role === UserRole.CREATOR) {
        this.router.navigate(['creator']);
      } else {
        this.router.navigate(['participant']);
      }
    } else {
      this.notificationService.show('Login failed!');
    }
  }

}
