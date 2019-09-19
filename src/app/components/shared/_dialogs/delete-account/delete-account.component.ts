import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../../../creator/_dialogs/room-edit/room-edit.component';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit {

  rooms: Room[];


  /**
   * The confirm button type of the delete account.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;


  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private roomService: RoomService,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService, ) { }

  ngOnInit() {
    this.announce();
    this.roomService.getCreatorRooms().subscribe(rooms => {
      this.rooms = rooms.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    });
  }

  public announce() {
    const lang: string = this.translationService.currentLang;

    // current live announcer content must be cleared before next read
    this.liveAnnouncer.clear();

    if (lang === 'de') {
      this.liveAnnouncer.announce('Willst du dein Konto mit allen Sitzungen unwiderruflich löschen?', 'assertive');
    } else {
      this.liveAnnouncer.announce('Do you really want to irrevocably delete your account with the associated sessions?', 'assertive');
    }

  }


  close(type: string): void {
    this.dialogRef.close(type);
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildDeleteAccountActionCallback(): () => void {
    return () => this.close('delete');
  }
}
