import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../../services/http/room.service';
import { ProfanityFilter, Room } from '../../../../models/room';
import { UserRole } from '../../../../models/user-roles.enum';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { defaultCategories } from '../../../../utils/defaultCategories';
import { FormControl, Validators } from '@angular/forms';
import { LanguageService } from '../../../../services/util/language.service';
import { SessionService } from '../../../../services/util/session.service';
import { RoomSettingsOverviewComponent } from '../room-settings-overview/room-settings-overview.component';

const invalidRegex = /[^A-Z0-9_\-.~]+/gi;

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnInit {
  shortIdAlreadyUsed = false;
  room: Room;
  roomId: string;
  user: User;
  hasCustomShortId = false;
  isLoading = false;
  readonly roomNameLengthMin = 3;
  readonly roomNameLengthMax = 30;
  roomNameFormControl = new FormControl('', [
    Validators.required, Validators.minLength(this.roomNameLengthMin), Validators.maxLength(this.roomNameLengthMax)
  ]);
  readonly shortIdLengthMin = 3;
  readonly shortIdLengthMax = 30;
  roomShortIdFormControl = new FormControl('', [
    Validators.required, Validators.minLength(this.shortIdLengthMin), Validators.maxLength(this.shortIdLengthMax),
    Validators.pattern('[a-zA-Z0-9_\\-.~]+'), this.verifyAlreadyUsed.bind(this)
  ]);

  constructor(
    private roomService: RoomService,
    private router: Router,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<RoomCreateComponent>,
    private translateService: TranslateService,
    private authenticationService: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private languageService: LanguageService,
    private sessionService: SessionService,
    private dialog: MatDialog,
  ) {
    this.languageService.getLanguage().subscribe(lang => this.translateService.use(lang));
  }

  ngOnInit() {
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  resetInvalidCharacters(): void {
    this.shortIdAlreadyUsed = false;
    if (this.roomShortIdFormControl.value) {
      this.roomShortIdFormControl.setValue(this.roomShortIdFormControl.value.replace(invalidRegex, ''));
    }
  }

  verifyAlreadyUsed(c: FormControl) {
    return this.shortIdAlreadyUsed ? {
      shortId: {
        valid: false
      }
    } : null;
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
      this.authenticationService.guestLogin(UserRole.CREATOR).subscribe(() => {
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
    const newRoom = new Room();
    newRoom.name = longRoomName;
    newRoom.abbreviation = '00000000';
    newRoom.description = { ops: [] };
    newRoom.blacklist = '[]';
    newRoom.questionsBlocked = false;
    const categories = defaultCategories[this.languageService.currentLanguage()] || defaultCategories.default;
    newRoom.tags = [...categories];
    newRoom.profanityFilter = ProfanityFilter.NONE;
    newRoom.shortId = this.hasCustomShortId ? this.roomShortIdFormControl.value : undefined;
    newRoom.conversationDepth = 7;
    newRoom.brainstormingActive = true;
    newRoom.quizActive = false;
    newRoom.bonusArchiveActive = true;
    this.roomService.addRoom(newRoom, () => {
      this.shortIdAlreadyUsed = true;
      this.roomShortIdFormControl.updateValueAndValidity();
      this.isLoading = false;
    }).subscribe(room => {
      this.room = room;
      this.translateService.get('home-page.created', { longRoomName })
        .subscribe(msg => this.notification.show(msg));
      this.authenticationService.setAccess(room.shortId, UserRole.CREATOR);
      this.authenticationService.assignRole(UserRole.CREATOR);
      this.router.navigate(['/creator/room/' + encodeURIComponent(room.shortId)]).then(() => {
        this.sessionService.getRoomOnce().subscribe(enteredRoom => {
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
}
