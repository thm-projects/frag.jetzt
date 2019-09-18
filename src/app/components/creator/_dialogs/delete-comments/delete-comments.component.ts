import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../room-edit/room-edit.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-comment',
  templateUrl: './delete-comments.component.html',
  styleUrls: ['./delete-comments.component.scss']
})
export class DeleteCommentsComponent implements OnInit {

  /**
   * The confirm button type of the dialog.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;


  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService )  { }


  ngOnInit() {
    this.announce();
  }


  public announce() {
    const lang: string = this.translationService.currentLang;

    // current live announcer content must be cleared before next read
    this.liveAnnouncer.clear();

    if (lang === 'de') {
      this.liveAnnouncer.announce('Willst du wirklich alle Fragen dieser Sitzung löschen?');
    } else {
      this.liveAnnouncer.announce('Do you really want to delete all questions of this session?');
    }
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildCommentsDeleteActionCallback(): () => void {
    return () => this.dialogRef.close('delete');
  }
}
