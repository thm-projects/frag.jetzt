import { Component, Inject, OnInit } from '@angular/core';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-answer',
  templateUrl: './delete-answer.component.html',
  styleUrls: ['./delete-answer.component.scss'],
  standalone: false,
})
export class DeleteAnswerComponent implements OnInit {
  confirmButtonType: DialogConfirmActionButtonType =
    DialogConfirmActionButtonType.Alert;

  constructor(
    public dialogRef: MatDialogRef<DeleteAnswerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: object,
    private liveAnnouncer: LiveAnnouncer,
    private translationService: TranslateService,
  ) {}

  ngOnInit() {
    this.translationService
      .get('comment-page.really-delete-answer')
      .subscribe((msg) => {
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
