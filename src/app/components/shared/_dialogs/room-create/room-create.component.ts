import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { UserRole } from '../../../../models/user-roles.enum';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { defaultCategories } from '../../../../utils/defaultCategories';
import { FormControl, Validators } from '@angular/forms';
import { SessionService } from '../../../../services/util/session.service';
import { RoomSettingsOverviewComponent } from '../room-settings-overview/room-settings-overview.component';
import { GptService } from 'app/services/http/gpt.service';
import { ReplaySubject, switchMap, takeUntil } from 'rxjs';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';

const invalidRegex = /[^A-Z0-9_\-.~]+/gi;

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss'],
})
export class RoomCreateComponent implements OnInit, OnDestroy {
  shortIdAlreadyUsed = false;
  room: Room;
  roomId: string;
  user: User;
  hasCustomShortId = true;
  isLoading = false;
  readonly roomNameLengthMin = 3;
  readonly roomNameLengthMax = 30;
  roomNameFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.roomNameLengthMin),
    Validators.maxLength(this.roomNameLengthMax),
  ]);
  readonly shortIdLengthMin = 3;
  readonly shortIdLengthMax = 30;
  roomShortIdFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.shortIdLengthMin),
    Validators.maxLength(this.shortIdLengthMax),
    Validators.pattern('[a-zA-Z0-9_\\-.~]+'),
    this.verifyAlreadyUsed.bind(this),
  ]);
  private destroyer = new ReplaySubject(1);

  constructor(
    private roomService: RoomService,
    private router: Router,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<RoomCreateComponent>,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sessionService: SessionService,
    private dialog: MatDialog,
    private gptService: GptService,
    private accountState: AccountStateService,
    private appState: AppStateService,
  ) {}

  ngOnInit() {
    this.accountState.user$
      .pipe(takeUntil(this.destroyer))
      .subscribe((newUser) => (this.user = newUser));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  resetInvalidCharacters(): void {
    this.shortIdAlreadyUsed = false;
    if (this.roomShortIdFormControl.value) {
      this.roomShortIdFormControl.setValue(
        this.roomShortIdFormControl.value.replace(invalidRegex, ''),
      );
    }
  }

  verifyAlreadyUsed(c: FormControl) {
    return this.shortIdAlreadyUsed
      ? {
          shortId: {
            valid: false,
          },
        }
      : null;
  }

  checkLogin() {
    if (this.isLoading) {
      return;
    }
    if (this.roomNameFormControl.value) {
      this.roomNameFormControl.setValue(this.roomNameFormControl.value.trim());
    }
    if (this.roomNameFormControl.invalid) {
      return;
    }
    if (this.hasCustomShortId && this.roomShortIdFormControl.invalid) {
      return;
    }
    this.isLoading = true;
    if (!this.user) {
      this.accountState.forceLogin().subscribe(() => {
        this.addRoom(this.roomNameFormControl.value);
      });
    } else {
      this.addRoom(this.roomNameFormControl.value);
    }
  }

  addRoom(longRoomName: string) {
    longRoomName = longRoomName.trim();
    if (!longRoomName) {
      this.isLoading = false;
      return;
    }
    const categories =
      defaultCategories[this.appState.getCurrentLanguage()] ||
      defaultCategories.default;
    const newRoom = new Room({
      name: longRoomName,
      tags: [...categories],
      shortId: this.hasCustomShortId
        ? this.roomShortIdFormControl.value
        : undefined,
      directSend: true,
    });
    this.roomService
      .addRoom(newRoom, () => {
        this.shortIdAlreadyUsed = true;
        this.roomShortIdFormControl.updateValueAndValidity();
        this.isLoading = false;
      })
      .subscribe((room) => {
        this.createDefaultTopic(room.id);
        this.room = room;
        this.translateService
          .get('home-page.created', { longRoomName })
          .subscribe((msg) => this.notification.show(msg));
        this.accountState
          .setAccess(room.shortId, room.id, UserRole.CREATOR)
          .subscribe();
        this.accountState.updateAccess(room.shortId);
        this.router
          .navigate(['/creator/room/' + encodeURIComponent(room.shortId)])
          .then(() => {
            this.sessionService.getRoomOnce().subscribe((enteredRoom) => {
              const ref = this.dialog.open(RoomSettingsOverviewComponent, {
                width: '600px',
              });
              ref.componentInstance.room = enteredRoom;
            });
          });
        this.closeDialog();
      });
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
  buildRoomCreateActionCallback(): () => void {
    return () => this.checkLogin();
  }

  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  private createDefaultTopic(roomId: string) {
    this.translateService
      .get('home-page.gpt-topic-general')
      .subscribe((msg) => {
        this.gptService
          .getStatusForRoom(roomId)
          .pipe(
            switchMap(() =>
              this.gptService.patchPreset(roomId, {
                topics: [
                  {
                    description: msg,
                    active: true,
                  },
                ],
              }),
            ),
          )
          .subscribe();
      });
  }
}
