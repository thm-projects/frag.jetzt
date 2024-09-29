import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { Moderator } from '../../../../models/moderator';
import { ModeratorDeleteComponent } from '../../../creator/_dialogs/moderator-delete/moderator-delete.component';
import { FormControl, Validators, AbstractControl } from '@angular/forms';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { ModeratorRefreshCodeComponent } from '../../../creator/_dialogs/moderator-refresh-code/moderator-refresh-code.component';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { User } from 'app/models/user';
import { UserRole } from '../../../../models/user-roles.enum';

import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);

function emailValidator(
  control: AbstractControl,
): { [key: string]: boolean } | null {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

  if (control.value && !emailRegex.test(control.value)) {
    return { invalidEmail: true };
  }
  return null;
}

@Component({
  selector: 'app-moderators',
  templateUrl: './moderators.component.html',
  styleUrls: ['./moderators.component.scss'],
})
export class ModeratorsComponent implements OnInit, OnDestroy {
  __debug = false;
  @Input() isCreator: boolean;
  protected readonly i18n = i18n;
  roomId: string;
  moderators: Moderator[] = [];
  userIds: string[] = [];
  moderatorShortId: string;
  showCode = false;
  usernameFormControl = new FormControl('', [
    Validators.required,
    emailValidator,
  ]);

  private isLoading = true;
  private notGeneratedMessage: string;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public dialogRef: MatDialogRef<ModeratorsComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected moderatorService: ModeratorService,
    appState: AppStateService,
    @Inject(MAT_DIALOG_DATA) public data: object,
  ) {
    appState.language$.pipe(takeUntil(this._destroyer)).subscribe(() => {
      this.translationService
        .get('moderators-dialog.not-generated')
        .subscribe((msg) => (this.notGeneratedMessage = msg));
    });
  }

  __debug_addMockModerators() {
    this.moderators = [
      new Moderator('accountID', 'roomID', 'loginID', UserRole.PARTICIPANT),
      new Moderator('accountID', 'roomID', 'loginID', UserRole.CREATOR),
      { accountId: 'accountID', roomId: 'roomID' } as Moderator,
    ];
  }
  showCodeTemporarily() {
    this.showCode = true;

    setTimeout(() => {
      this.showCode = false;
    }, 3000);
  }

  get shortIdCode() {
    if (!this.moderatorShortId) {
      if (this.isLoading) {
        return '---- ----';
      }
      return this.notGeneratedMessage;
    }
    return this.moderatorShortId;
  }
  addModeratorOnEnter(loginId: string): void {
    if (this.usernameFormControl.valid) {
      this.addModerator(loginId);
      // Clear the input field
      this.usernameFormControl.reset();
    } else {
      this.translationService
        .get('moderators-dialog.email-error')
        .subscribe((msg) => {
          this.notificationService.show(msg);
        });
    }
  }

  ngOnInit() {
    this.moderatorService.getModeratorRoomCode(this.roomId).subscribe({
      next: (shortId) => {
        this.moderatorShortId = shortId;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });

    this.getModerators();
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.add-moderators';
  }

  copyShortIdLink() {
    const url = `${window.location.protocol}//${window.location.host}/moderator/join/${this.moderatorShortId}`;
    navigator.clipboard.writeText(url).then(
      () => {
        this.translationService
          .get('moderators-dialog.session-id-copied')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
      () => {
        this.translationService
          .get('moderators-dialog.something-went-wrong')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
    );
  }

  refreshCode() {
    const reference = this.dialog.open(ModeratorRefreshCodeComponent, {
      minWidth: 'var(--temp-min-width)',
      width: '400px',
    });
    reference.afterClosed().subscribe((value) => {
      if (value === true) {
        this.moderatorService.refreshRoomCode(this.roomId).subscribe({
          next: (newShortId) => {
            this.moderatorShortId = newShortId;
            // this.moderators = this.moderators.filter((m) => m.loginId);
            this.translationService
              .get('moderators-dialog.code-recreated')
              .subscribe((msg) => this.notificationService.show(msg));
          },
          error: () => {
            this.translationService
              .get(i18n()['something-went-wrong'])
              .subscribe((msg) => this.notificationService.show(msg));
          },
        });
      }
    });
  }

  getModerators() {
    this.moderatorService.get(this.roomId).subscribe((list) => {
      this.moderators = list;
      this.moderators.forEach((user: Moderator, i) => {
        this.userIds[i] = user.accountId;
      });
      this.moderatorService.getUserData(this.userIds).subscribe((users) => {
        users.forEach((user: User, i) => {
          this.moderators[i].loginId = (
            user as unknown as { email: string }
          ).email;
        });
      });
    });
  }

  addModerator(loginId: string) {
    if (this.usernameFormControl.invalid) {
      this.translationService
        .get('moderators-dialog.email-error')
        .subscribe((msg) => {
          this.notificationService.show(msg);
        });
      return;
    }

    this.moderatorService.getUserId(loginId).subscribe((list) => {
      if (list.length === 0) {
        this.translationService
          .get('moderators-dialog.not-found')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
        return;
      }

      this.moderatorService.add(this.roomId, list[0].id).subscribe({
        next: () => {
          this.moderators.push(new Moderator(list[0].id, this.roomId, loginId));

          this.translationService
            .get('moderators-dialog.added')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });

          this.usernameFormControl.reset();
        },
        error: () => {
          this.translationService
            .get('moderators-dialog.something-went-wrong')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
      });
    });
  }

  openDeleteRoomDialog(moderator: Moderator): void {
    const dialogRef = this.dialog.open(ModeratorDeleteComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.loginId = moderator.loginId;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.removeModerator(
          moderator.accountId,
          this.moderators.indexOf(moderator),
        );
      }
    });
  }

  removeModerator(userId: string, index: number) {
    this.moderatorService.delete(this.roomId, userId).subscribe(() => {
      this.moderators.splice(index, 1);
    });
    this.translationService
      .get('moderators-dialog.removed')
      .subscribe((msg) => {
        this.notificationService.show(msg);
      });
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
