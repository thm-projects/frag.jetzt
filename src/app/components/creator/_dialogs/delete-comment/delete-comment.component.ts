import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../room-edit/room-edit.component';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-comment',
  templateUrl: './delete-comment.component.html',
  styleUrls: ['./delete-comment.component.scss']
})
export class DeleteCommentComponent implements OnInit {

  /**
   * The confirm button type of the dialog.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;


  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService ) { }

  ngOnInit() {
    this.announce();
  }

  close(type: string): void {
    this.dialogRef.close(type);
  }

  public announce() {
    const lang: string = this.translationService.currentLang;

    // current live announcer content must be cleared before next read
    this.liveAnnouncer.clear();

    if (lang === 'de') {
      this.liveAnnouncer.announce('Willst du diese Frage wirklich löschen?');
    } else {
      this.liveAnnouncer.announce('Do you really want to delete this question');
    }
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
  buildCommentDeleteActionCallback(): () => void {
    return () => this.close('delete');
  }
}
