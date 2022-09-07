import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { validatePassword } from '../register/register.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ErrorStateMatcher } from '@angular/material/core';


export class PasswordResetErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

  initProcess = true;

  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);
  usernameFormControl2 = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);
  passwordFormControl2 = new FormControl('', [Validators.required, validatePassword(this.passwordFormControl)]);
  keyFormControl = new FormControl('', [Validators.required]);

  matcher = new PasswordResetErrorStateMatcher();

  constructor(
    private translationService: TranslateService,
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public dialogRef: MatDialogRef<PasswordResetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private liveAnnouncer: LiveAnnouncer,
  ) {
  }

  ngOnInit() {
    this.announce();
  }

  public announce() {
    const lang: string = this.translationService.currentLang;

    // current live announcer content must be cleared before next read
    this.liveAnnouncer.clear();

    if (lang === 'de') {
      this.liveAnnouncer.announce('Hier kannst du dein Passwort zurücksetzen, ' +
        'indem du per E-Mail einen Passwortrücksetz-Schlüssel erhälst und mit diesem ein neues Passwort setzt.', 'assertive');
    } else {
      this.liveAnnouncer.announce('Here you can reset your password ' +
        'by receiving a password reset key via e-mail and setting a new password with it.', 'assertive');
    }

  }

  setUsername(username: string) {
    this.usernameFormControl2.setValue(username);
  }

  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }


  resetPassword(username: string): void {
    username = username.trim();

    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email')) {
      this.authenticationService.resetPassword(username).subscribe((ret: string) => {
        // ret is null when no error happened, otherwise ret has error message
        if (ret === 'Account has activation key set') {
          this.translationService.get('password-reset.reset-failed-because-of-activation-process').subscribe(message => {
            this.notificationService.show(message);
          });
        } else {
          this.translationService.get('password-reset.reset-successful').subscribe(message => {
            this.notificationService.show(message);
          });
        }
        this.closeDialog();
      });
    } else {
      this.translationService.get('password-reset.input-incorrect').subscribe(message => {
        this.notificationService.show(message);
      });
    }
  }

  setNewPassword(email: string, key: string, password: string) {
    if (!this.usernameFormControl2.hasError('required') && !this.usernameFormControl2.hasError('email')
      && !this.passwordFormControl2.hasError('passwordIsEqual')) {
      if (email !== '' && key !== '' && password !== '') {
        this.authenticationService.setNewPassword(email, key, password).subscribe((result) => {
          if (result === 'Key expired') {
            this.translationService.get('password-reset.new-password-key-expired').subscribe(message => {
              this.notificationService.show(message);
            });
          } else if (result === 'Invalid Key') {
            this.translationService.get('password-reset.new-password-key-invalid').subscribe(message => {
              this.notificationService.show(message);
            });
          } else {
            this.translationService.get('password-reset.new-password-successful').subscribe(message => {
              this.notificationService.show(message);
            });
            this.closeDialog();
          }
        });
      } else {
        this.translationService.get('password-reset.input-incorrect').subscribe(message => {
          this.notificationService.show(message);
        });
      }
    } else {
      this.translationService.get('password-reset.input-incorrect').subscribe(message => {
        this.notificationService.show(message);
      });
    }
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildPasswordResetActionCallback(email: HTMLInputElement): () => void {
    return () => this.resetPassword(email.value);
  }
}
