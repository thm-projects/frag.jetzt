import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  LoginResult,
  LoginResultArray,
} from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { UserManagementService } from '../../../services/util/user-management.service';
import { KeycloakService } from 'app/services/util/keycloak.service';
import { UUID } from 'app/utils/ts-utils';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { Subject, take, takeUntil } from 'rxjs';
import { LanguageService } from 'app/services/util/language.service';

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
})
export class LoginComponent implements OnInit, OnDestroy {
  redirectUrl = null;
  matcher = new LoginErrorStateMatcher();
  name = '';
  hide = true;
  providers: KeycloakProvider[] = [];
  access: string;
  private defaultKeycloakProvider: KeycloakProvider;
  private destroyer = new Subject();

  constructor(
    public userManagementService: UserManagementService,
    public router: Router,
    private languageService: LanguageService,
    private translationService: TranslateService,
    public notificationService: NotificationService,
    public dialog: MatDialog,
    private keycloak: KeycloakService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.access = lang[0].toUpperCase() + lang.slice(1);
      });
    const onMessage = (msgs: Record<string, string>) => {
      const name = msgs['login.default-keycloak-name'];
      const desc = msgs['login.default-keycloak-description'];
      const lang = this.languageService.currentLanguage();
      const access = lang[0].toUpperCase() + lang.slice(1);
      if (this.defaultKeycloakProvider) {
        this.defaultKeycloakProvider['translated_name' + access] = name;
        this.defaultKeycloakProvider['translated_description' + access] = desc;
      }
    };
    this.keycloak.providers$
      .pipe(take(1), takeUntil(this.destroyer))
      .subscribe((data) => {
        this.providers = data;
        this.defaultKeycloakProvider = this.providers.find(
          (p) => p.nameDe.length < 1,
        );
        this.translationService
          .get([
            'login.default-keycloak-name',
            'login.default-keycloak-description',
          ])
          .subscribe((msgs) => onMessage(msgs));
      });
    this.translationService
      .getStreamOnTranslationChange([
        'login.default-keycloak-name',
        'login.default-keycloak-description',
      ])
      .pipe(takeUntil(this.destroyer))
      .subscribe((msgs) => onMessage(msgs));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  providerLogin(keycloakId: UUID): void {
    this.keycloak.doKeycloakLogin(keycloakId, true).subscribe();
  }

  guestLogin(): void {
    this.userManagementService
      .loginAsGuest()
      .subscribe((loginSuccessful) => this.checkLogin(loginSuccessful, true));
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): void {
    this.dialog.closeAll();
  }

  private checkLogin(loginResult: LoginResultArray, isGuest = false) {
    if (
      [
        LoginResult.SessionExpired,
        LoginResult.FailureException,
        LoginResult.DisabledException,
      ].includes(loginResult[0])
    ) {
      this.translationService
        .get('login.login-data-incorrect')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
      return;
    }
    if (loginResult[0] === LoginResult.AccessDenied && isGuest) {
      this.translationService
        .get('login.guest-expired')
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
