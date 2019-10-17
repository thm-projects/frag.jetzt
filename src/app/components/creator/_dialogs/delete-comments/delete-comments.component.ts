import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { TranslateService } from '@ngx-translate/core';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { CommentSettingsComponent } from '../comment-settings/comment-settings.component';

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
  roomId: string;
  bonusQuestions = false;

  constructor(public dialogRef: MatDialogRef<CommentSettingsComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService,
              private tokenService: BonusTokenService)  { }


  ngOnInit() {
    this.translationService.get('room-page.really-delete-comments').subscribe(msg => {
      this.liveAnnouncer.announce(msg);
    });
    this.tokenService.getTokensByRoomId(this.roomId).subscribe(tokens => {
      if (tokens.length > 0) {
        this.bonusQuestions = true;
      }
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
