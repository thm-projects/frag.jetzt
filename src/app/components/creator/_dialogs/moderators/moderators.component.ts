import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { Moderator } from '../../../../models/moderator';
import { ModeratorDeleteComponent } from '../moderator-delete/moderator-delete.component';
import { FormControl, Validators } from '@angular/forms';
import { EventService } from '../../../../services/util/event.service';

@Component({
  selector: 'app-moderators',
  templateUrl: './moderators.component.html',
  styleUrls: ['./moderators.component.scss']
})
export class ModeratorsComponent implements OnInit {

  roomId: string;
  moderators: Moderator[] = [];
  userIds: string[] = [];

  usernameFormControl = new FormControl('', [Validators.email]);

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected moderatorService: ModeratorService,
    protected langService: LanguageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public eventService: EventService) {
      langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.getModerators();
  }

  getModerators() {
    this.moderatorService.get(this.roomId).subscribe(list => {
      this.moderators = list;
      this.moderators.forEach((user, i) => {
        this.userIds[i] = user.userId;
      });
      this.moderatorService.getUserData(this.userIds).subscribe(users => {
        users.forEach((user, i) => {
          this.moderators[i].loginId = user.loginId;
        });
      });
    });
  }

  addModerator(loginId: string) {
    this.moderatorService.getUserId(loginId).subscribe( list => {
      if (list.length === 0) {
        this.translationService.get('room-page.moderator-not-found').subscribe(msg => {
          this.notificationService.show(msg);
        });
        return;
      }
      this.moderatorService.add(this.roomId, list[0].id).subscribe();
      this.moderatorService.addToHistory(this.roomId, list[0].id);
      this.moderators.push(new Moderator(list[0].id, loginId));
      this.translationService.get('room-page.moderator-added').subscribe(msg => {
        this.notificationService.show(msg);
      });
    });
  }

  openDeleteRoomDialog(moderator: Moderator): void {
    const dialogRef = this.dialog.open(ModeratorDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.loginId = moderator.loginId;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.removeModerator(moderator.userId, this.moderators.indexOf(moderator));
        }
      });
  }

  removeModerator(userId: string, index: number) {
    this.moderatorService.delete(this.roomId, userId).subscribe();
    this.translationService.get('room-page.moderator-removed').subscribe(msg => {
      this.notificationService.show(msg);
    });
    this.moderators.splice(index, 1);
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
