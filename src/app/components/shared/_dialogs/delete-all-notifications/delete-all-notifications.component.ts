import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DialogConfirmActionButtonType
} from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-all-notifications',
  templateUrl: './delete-all-notifications.component.html',
  styleUrls: ['./delete-all-notifications.component.scss']
})
export class DeleteAllNotificationsComponent implements OnInit {

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;

  constructor(
    public dialogRef: MatDialogRef<DeleteAllNotificationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private liveAnnouncer: LiveAnnouncer,
    private translationService: TranslateService
  ) {
  }

  ngOnInit() {
    this.translationService.get('delete-notifications.message').subscribe(msg => {
      this.liveAnnouncer.announce(msg);
    });
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
  buildCommentDeleteActionCallback(): () => void {
    return () => this.dialogRef.close('delete');
  }
}
