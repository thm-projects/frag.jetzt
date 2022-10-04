import { Component, Inject, OnInit } from '@angular/core';
import {
  DialogConfirmActionButtonType
} from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommentSettingsComponent } from '../comment-settings/comment-settings.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-moderation-comments',
  templateUrl: './delete-moderation-comments.component.html',
  styleUrls: ['./delete-moderation-comments.component.scss']
})
export class DeleteModerationCommentsComponent implements OnInit {

  /**
   * The confirm button type of the dialog.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;
  roomId: string;

  constructor(
    public dialogRef: MatDialogRef<CommentSettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private liveAnnouncer: LiveAnnouncer,
    private translationService: TranslateService,
  ) {
  }


  ngOnInit() {
    this.translationService.get('room-page.really-delete-comments').subscribe(msg => {
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
  buildCommentsDeleteActionCallback(): () => void {
    return () => this.dialogRef.close('delete');
  }

}
