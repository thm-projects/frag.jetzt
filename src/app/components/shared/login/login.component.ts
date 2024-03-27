import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { KeycloakService } from 'app/services/util/keycloak.service';
import { UUID } from 'app/utils/ts-utils';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { Subject, take, takeUntil } from 'rxjs';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

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
    public router: Router,
    private appState: AppStateService,
    private translationService: TranslateService,
    public notificationService: NotificationService,
    public dialog: MatDialog,
    private keycloak: KeycloakService,
    @Inject(MAT_DIALOG_DATA) public data: object,
    private accountState: AccountStateService,
    private dialogRef: MatDialogRef<LoginComponent>,
  ) {}

  ngOnInit(): void {
    this.appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.access = lang[0].toUpperCase() + lang.slice(1);
      });
    const onMessage = (msgs: Record<string, string>) => {
      const name = msgs['login.default-keycloak-name'];
      const desc = msgs['login.default-keycloak-description'];
      const lang = this.appState.getCurrentLanguage();
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
    this.dialogRef.close(keycloakId);
  }

  guestLogin(): void {
    this.dialogRef.close(null);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): void {
    this.dialog.closeAll();
  }

  private checkLogin() {
    this.translationService.get('login.guest-expired').subscribe((message) => {
      this.notificationService.show(message);
    });
    this.translationService
      .get('login.login-error-unknown', { code: '??' })
      .subscribe((message) => {
        this.notificationService.show(message);
      });
    this.dialog.closeAll();
    this.router.navigate([this.redirectUrl ?? 'user']);
  }
}
