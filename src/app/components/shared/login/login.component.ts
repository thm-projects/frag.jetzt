import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  LoginResult,
  LoginResultArray,
} from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { UserActivationComponent } from '../../home/_dialogs/user-activation/user-activation.component';
import { PasswordResetComponent } from '../../home/_dialogs/password-reset/password-reset.component';
import { RegisterComponent } from '../../home/_dialogs/register/register.component';
import { ErrorStateMatcher } from '@angular/material/core';
import { UserManagementService } from '../../../services/util/user-management.service';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';

export class LoginErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    const isSubmitted = form && form.submitted;
    return (
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnChanges {
  username: string;
  password: string;
  redirectUrl = null;
  usernameFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [Validators.required]);
  matcher = new LoginErrorStateMatcher();
  name = '';
  hide = true;

  constructor(
    public userManagementService: UserManagementService,
    public router: Router,
    private translationService: TranslateService,
    public notificationService: NotificationService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    let u = false;
    let p = false;
    if (changes.username) {
      this.usernameFormControl.setValue(changes.username.currentValue);
      u = true;
    }
    if (changes.password) {
      this.passwordFormControl.setValue(changes.password.currentValue);
      p = true;
    }
    if (
      u &&
      p &&
      !changes.username.isFirstChange() &&
      !changes.username.isFirstChange()
    ) {
      this.activateUser();
    }
  }

  activateUser(): void {
    this.dialog
      .open(UserActivationComponent, {
        width: '350px',
        data: {
          name: this.username,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.success) {
          this.login(this.username, this.password);
        }
      });
  }

  login(username: string, password: string): void {
    this.username = username.trim();
    this.password = password.trim();

    if (
      !this.usernameFormControl.hasError('required') &&
      !this.usernameFormControl.hasError('email') &&
      !this.passwordFormControl.hasError('required')
    ) {
      this.userManagementService
        .login(this.username, this.password)
        .subscribe((loginSuccessful) => this.checkLogin(loginSuccessful));
    } else {
      this.translationService
        .get('login.input-incorrect')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
    }
  }

  guestLogin(): void {
    this.userManagementService
      .loginAsGuest()
      .subscribe((loginSuccessful) => this.checkLogin(loginSuccessful));
  }

  openPasswordDialog(initProcess = true): void {
    const ref = this.dialog.open(PasswordResetComponent, {
      width: '350px',
    });
    ref.componentInstance.initProcess = initProcess;
    ref.componentInstance.setUsername(this.username);
  }

  openRegisterDialog(): void {
    this.dialog
      .open(RegisterComponent, {
        width: '350px',
      })
      .afterClosed()
      .subscribe((result) => {
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
  buildCloseDialogActionCallback(): void {
    this.dialog.closeAll();
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildLoginActionCallback(
    userEmail: HTMLInputElement,
    userPassword: HTMLInputElement,
  ): () => void {
    return () => this.login(userEmail.value, userPassword.value);
  }

  private checkLogin(loginResult: LoginResultArray) {
    if (loginResult[0] === LoginResult.FailureActivation) {
      this.activateUser();
      return;
    }
    if (loginResult[0] === LoginResult.FailurePasswordReset) {
      this.openPasswordDialog(false);
      return;
    }
    if (loginResult[0] === LoginResult.SessionExpired) {
      this.translationService
        .get('login.login-data-incorrect')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
      return;
    }
    if (loginResult[0] === LoginResult.FailurePasswordExpired) {
      this.translationService
        .get('login.login-data-expired')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
      return;
    }
    if (loginResult[0] !== LoginResult.Success) {
      this.translationService
        .get('login.login-error-unknown', { code: loginResult[0] })
        .subscribe((message) => {
          this.notificationService.show(message);
        });
      return;
    }
    this.dialog.closeAll();
    this.router.navigate([this.redirectUrl ?? 'user']);
  }
}
