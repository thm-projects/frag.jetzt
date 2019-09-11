import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { ErrorStateMatcher, MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { UserRole } from '../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { UserActivationComponent } from '../../home/_dialogs/user-activation/user-activation.component';
import { PasswordResetComponent } from '../../home/_dialogs/password-reset/password-reset.component';
import { RegisterComponent } from '../../home/_dialogs/register/register.component';
import { EventService } from '../../../services/util/event.service';

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
export class LoginComponent implements OnInit, OnChanges {
  role: UserRole;
  username: string;
  password: string;
  isStandard = true;

  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);

  matcher = new LoginErrorStateMatcher();

  name = '';

  constructor(public authenticationService: AuthenticationService,
              public router: Router,
              private translationService: TranslateService,
              public notificationService: NotificationService,
              public dialog: MatDialog,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    let u, p = false;
    if (changes.username) {
      this.usernameFormControl.setValue(changes.username.currentValue);
      u = true;
    }
    if (changes.password) {
      this.passwordFormControl.setValue(changes.password.currentValue);
      p = true;
    }
    if (u && p && !changes.username.isFirstChange() && !changes.username.isFirstChange()) {
      // TODO: this throws an Exception because data and UI are inconsistent
      this.activateUser();
    }
  }

  activateUser(): void {
    this.dialog.open(UserActivationComponent, {
      width: '350px',
      data: {
        name: this.username
      }
    }).afterClosed().subscribe(result => {
      if (result && result.success) {
        this.login(this.username, this.password);
      }
    });
  }

  login(username: string, password: string): void {
    this.username = username.trim();
    this.password = password.trim();

    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email') &&
      !this.passwordFormControl.hasError('required')) {
      this.authenticationService.login(this.username, this.password, this.role).subscribe(loginSuccessful => {
        this.checkLogin(loginSuccessful);
      });
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
      this.translationService.get('login.login-successful').subscribe(message => {
        this.notificationService.show(message);
      });
      this.dialog.closeAll();
      if (this.isStandard) {
        this.router.navigate(['user']);
      }
    } else if (loginSuccessful === 'activation') {
      this.activateUser();
    } else {
      this.translationService.get('login.login-data-incorrect').subscribe(message => {
        this.notificationService.show(message);
      });
    }
  }

  openPasswordDialog(): void {
    this.dialog.open(PasswordResetComponent, {
      width: '350px'
    });
  }

  openRegisterDialog(): void {
    this.dialog.open(RegisterComponent, {
      width: '350px'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.usernameFormControl.setValue(result.username);
        this.passwordFormControl.setValue(result.password);
        this.username = result.username;
        this.password = result.password;
      }
    });
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialog.closeAll();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildLoginActionCallback(userEmail: HTMLInputElement, userPassword: HTMLInputElement): () => void {
    return () => this.login(userEmail.value, userPassword.value);
  }
}
