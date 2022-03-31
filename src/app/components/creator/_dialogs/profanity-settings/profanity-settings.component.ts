import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { EventService } from '../../../../services/util/event.service';
import { ProfanityFilter, Room } from '../../../../models/room';

@Component({
  selector: 'app-profanity-settings',
  templateUrl: './profanity-settings.component.html',
  styleUrls: ['./profanity-settings.component.scss']
})
export class ProfanitySettingsComponent implements OnInit {

  editRoom: Room;
  check = false;
  profanityCheck: boolean;
  censorPartialWordsCheck: boolean;
  censorLanguageSpecificCheck: boolean;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected roomService: RoomService,
              public router: Router,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.profanityCheck = this.editRoom.profanityFilter !== ProfanityFilter.DEACTIVATED;
    if (this.editRoom.profanityFilter === ProfanityFilter.ALL) {
      this.censorLanguageSpecificCheck = this.censorPartialWordsCheck = true;
    } else if (this.profanityCheck) {
      this.censorLanguageSpecificCheck = this.editRoom.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC;
      this.censorPartialWordsCheck = this.editRoom.profanityFilter === ProfanityFilter.PARTIAL_WORDS;
    }
  }

  showMessage(label: string, event: boolean) {
    if (event) {
      this.translationService.get('room-page.' + label).subscribe(msg => {
        this.notificationService.show(msg);
      });
    }
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog('abort');
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.save();
  }

  closeDialog(type: string): void {
    this.dialogRef.close(type);
  }

  save(): void {
    this.editRoom.questionsBlocked = this.check;
    this.editRoom.profanityFilter = this.profanityCheck ? ProfanityFilter.NONE : ProfanityFilter.DEACTIVATED;
    if (this.profanityCheck) {
      if (this.censorLanguageSpecificCheck && this.censorPartialWordsCheck) {
        this.editRoom.profanityFilter = ProfanityFilter.ALL;
      } else {
        this.editRoom.profanityFilter = this.censorLanguageSpecificCheck ? ProfanityFilter.LANGUAGE_SPECIFIC : ProfanityFilter.NONE;
        this.editRoom.profanityFilter = this.censorPartialWordsCheck ? ProfanityFilter.PARTIAL_WORDS : this.editRoom.profanityFilter;
      }
    }
    this.roomService.updateRoom(this.editRoom).subscribe();
    this.closeDialog('update');
  }

}
