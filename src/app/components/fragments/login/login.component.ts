import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { ErrorStateMatcher, MatDialog} from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { UserRole } from '../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { UserActivationComponent } from '../../dialogs/user-activation/user-activation.component';

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
  @Input() public role: UserRole;

  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);

  matcher = new LoginErrorStateMatcher();

  name = '';

  constructor(public authenticationService: AuthenticationService,
              public router: Router,
              private translationService: TranslateService,
              public notificationService: NotificationService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
  }

  login(username: string, password: string): void {
    this.name = username;
    username = username.trim();
    password = password.trim();

    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email') &&
      !this.passwordFormControl.hasError('required')) {
      this.authenticationService.login(username, password, this.role).subscribe(loginSuccessful => this.checkLogin(loginSuccessful));
    } else {
      this.translationService.get('login.input-incorrect').subscribe(message => {
        this.notificationService.show(message);
      });
    }
  }

  guestLogin(): void {
    this.authenticationService.guestLogin(this.role).subscribe(loginSuccessful => this.checkLogin(loginSuccessful));
  }

  private checkLogin(loginSuccessful: string) {
    if (loginSuccessful === 'true') {
      this.notificationService.show('Login successful!');
      if (this.role === UserRole.CREATOR) {
        this.router.navigate(['creator']);
      } else {
        this.router.navigate(['participant']);
      }
    } else if (loginSuccessful === 'activation') {
      this.dialog.open(UserActivationComponent, {
        width: '350px',
        data: {
          name: this.name
        }
      });
    } else {
      this.translationService.get('login.login-data-incorrect').subscribe(message => {
        this.notificationService.show(message);
      });
    }
  }
}
