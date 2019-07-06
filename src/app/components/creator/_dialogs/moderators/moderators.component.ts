import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { Moderator } from '../../../../models/moderator';

@Component({
  selector: 'app-moderators',
  templateUrl: './moderators.component.html',
  styleUrls: ['./moderators.component.scss']
})
export class ModeratorsComponent implements OnInit {

  roomId: string;
  moderators: Moderator[] = [];

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected moderatorService: ModeratorService,
    protected langService: LanguageService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.getModerators();
  }

  getModerators() {
    this.moderatorService.get(this.roomId).subscribe(list => {
      this.moderators = list;
    });
  }

  addModerator(loginId: string) {
    this.moderatorService.getUserId(loginId).subscribe( list => {
      if (list.length === 0) {
        this.notificationService.show('No User found with this E-Mail :(');
        return;
      }
      this.moderatorService.add(this.roomId, list[0].id).subscribe();
    });
  }

  removeModerator(userId: string) {
    this.moderatorService.delete(this.roomId, userId).subscribe();
  }
}
