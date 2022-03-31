import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProfanityFilter, Room } from '../../../../models/room';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { RoomService } from '../../../../services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';

@Component({
  selector: 'app-room-settings-overview',
  templateUrl: './room-settings-overview.component.html',
  styleUrls: ['./room-settings-overview.component.scss']
})
export class RoomSettingsOverviewComponent implements OnInit {

  @Input() room: Readonly<Room>;
  directSend: boolean;
  conversationEnabled: boolean;
  profanityFilter: ProfanityFilter;
  bonusArchiveEnabled: boolean;
  quizEnabled: boolean;
  brainstormingEnabled: boolean;

  constructor(
    private dialogRef: MatDialogRef<RoomSettingsOverviewComponent>,
    private dialog: MatDialog,
    private roomService: RoomService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
  ) {
  }

  ngOnInit(): void {
    this.directSend = this.room.directSend;
    this.conversationEnabled = this.room.conversationDepth > 0;
    this.profanityFilter = this.room.profanityFilter;
    this.bonusArchiveEnabled = this.room.bonusArchiveActive;
    this.quizEnabled = this.room.quizActive;
    this.brainstormingEnabled = this.room.brainstormingActive;
  }

  onConfirm() {
    this.roomService.patchRoom(this.room.id, {
      directSend: this.directSend,
      conversationDepth: this.conversationEnabled ? 7 : 0,
      profanityFilter: this.profanityFilter,
      bonusArchiveActive: this.bonusArchiveEnabled,
      quizActive: this.quizEnabled,
      brainstormingActive: this.brainstormingEnabled,
    }).subscribe({
      next: () => {
        this.translateService.get('room-page.changes-successful')
          .subscribe(msg => this.notificationService.show(msg));
      },
      error: () => {
        this.translateService.get('room-page.changes-gone-wrong')
          .subscribe(msg => this.notificationService.show(msg));
      }
    });
    this.dialogRef.close();
  }

  onCancel() {
    this.dialogRef.close();
  }

  toggleProfanityFilter(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    this.profanityFilter = this.profanityFilter !== ProfanityFilter.DEACTIVATED ?
      ProfanityFilter.DEACTIVATED : ProfanityFilter.NONE;
  }

  toggleProfanityLanguage(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    if (this.profanityFilter === ProfanityFilter.ALL) {
      this.profanityFilter = ProfanityFilter.PARTIAL_WORDS;
    } else if (this.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC) {
      this.profanityFilter = ProfanityFilter.NONE;
    } else if (this.profanityFilter === ProfanityFilter.PARTIAL_WORDS) {
      this.profanityFilter = ProfanityFilter.ALL;
    } else if (this.profanityFilter === ProfanityFilter.NONE) {
      this.profanityFilter = ProfanityFilter.LANGUAGE_SPECIFIC;
    }
  }

  toggleProfanityWords(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    if (this.profanityFilter === ProfanityFilter.ALL) {
      this.profanityFilter = ProfanityFilter.LANGUAGE_SPECIFIC;
    } else if (this.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC) {
      this.profanityFilter = ProfanityFilter.ALL;
    } else if (this.profanityFilter === ProfanityFilter.PARTIAL_WORDS) {
      this.profanityFilter = ProfanityFilter.NONE;
    } else if (this.profanityFilter === ProfanityFilter.NONE) {
      this.profanityFilter = ProfanityFilter.PARTIAL_WORDS;
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.room-settings-overview';
  }

}
