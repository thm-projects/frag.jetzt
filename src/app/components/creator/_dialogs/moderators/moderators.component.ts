import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { Moderator } from '../../../../models/moderator';
import { ModeratorDeleteComponent } from '../moderator-delete/moderator-delete.component';
import { FormControl, Validators } from '@angular/forms';
import { ExplanationDialogComponent } from '../../../shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { ModeratorRefreshCodeComponent } from '../moderator-refresh-code/moderator-refresh-code.component';

@Component({
  selector: 'app-moderators',
  templateUrl: './moderators.component.html',
  styleUrls: ['./moderators.component.scss']
})
export class ModeratorsComponent implements OnInit {

  @Input() isCreator: boolean;
  roomId: string;
  moderators: Moderator[] = [];
  userIds: string[] = [];
  moderatorShortId: string;

  get shortIdCode() {
    if (!this.moderatorShortId) {
      if (this.isLoading) {
        return '---- ----';
      }
      return this.notGeneratedMessage;
    }
    return this.moderatorShortId;
  }

  usernameFormControl = new FormControl('', [Validators.email]);
  private isLoading = true;
  private notGeneratedMessage: string;

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected moderatorService: ModeratorService,
    protected langService: LanguageService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    langService.getLanguage().subscribe(lang => {
      translationService.use(lang);
      this.translationService.get('moderators-dialog.not-generated')
        .subscribe(msg => this.notGeneratedMessage = msg);
    });
  }

  ngOnInit() {
    this.moderatorService.getModeratorRoomCode(this.roomId).subscribe(shortId => {
      this.moderatorShortId = shortId;
      this.isLoading = false;
    }, _ => this.isLoading = false);
    this.getModerators();
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.add-moderators';
  }

  copyShortIdLink() {
    const url = `${window.location.protocol}//${window.location.host}/moderator/join/${this.moderatorShortId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.translationService.get('moderators-dialog.session-id-copied').subscribe(msg => {
        this.notificationService.show(msg);
      });
    }, () => {
      this.translationService.get('moderators-dialog.something-went-wrong').subscribe(msg => {
        this.notificationService.show(msg);
      });
    });
  }

  refreshCode() {
    const reference = this.dialog.open(ModeratorRefreshCodeComponent);
    reference.afterClosed().subscribe(value => {
      if (value === true) {
        this.moderatorService.refreshRoomCode(this.roomId).subscribe(newShortId => {
          this.moderatorShortId = newShortId;
          this.moderators = this.moderators.filter(m => m.loginId);
          this.translationService.get('moderators-dialog.code-recreated')
            .subscribe(msg => this.notificationService.show(msg));
        }, () => {
          this.translationService.get('moderators-dialog.something-went-wrong')
            .subscribe(msg => this.notificationService.show(msg));
        });
      }
    });
  }

  getModerators() {
    this.moderatorService.get(this.roomId).subscribe(list => {
      this.moderators = list;
      this.moderators.forEach((user: any, i) => {
        this.userIds[i] = user.accountId;
      });
      this.moderatorService.getUserData(this.userIds).subscribe(users => {
        users.forEach((user: any, i) => {
          this.moderators[i].loginId = user.email;
        });
      });
    });
  }

  addModerator(loginId: string) {
    this.moderatorService.getUserId(loginId).subscribe(list => {
      if (list.length === 0) {
        this.translationService.get('moderators-dialog.not-found').subscribe(msg => {
          this.notificationService.show(msg);
        });
        return;
      }
      this.moderatorService.add(this.roomId, list[0].id).subscribe();
      // this.moderatorService.addToHistory(this.roomId, list[0].id);
      this.moderators.push(new Moderator(list[0].id, this.roomId, loginId));
      this.translationService.get('moderators-dialog.added').subscribe(msg => {
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
          this.removeModerator(moderator.accountId, this.moderators.indexOf(moderator));
        }
      });
  }

  removeModerator(userId: string, index: number) {
    this.moderatorService.delete(this.roomId, userId).subscribe(_ => {
      this.moderators.splice(index, 1);
    });
    this.translationService.get('moderators-dialog.removed').subscribe(msg => {
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
