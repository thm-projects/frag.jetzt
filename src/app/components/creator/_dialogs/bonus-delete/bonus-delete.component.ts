import { Component, Inject, OnInit } from '@angular/core';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';
import { BonusTokenComponent } from '../bonus-token/bonus-token.component';

@Component({
  selector: 'app-bonus-delete',
  templateUrl: './bonus-delete.component.html',
  styleUrls: ['./bonus-delete.component.scss']
})
export class BonusDeleteComponent implements OnInit {

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;
  multipleBonuses: boolean;
  reallyDeleteText: string;

  constructor(public dialogRef: MatDialogRef<BonusTokenComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService )  { }


  ngOnInit() {
    if (!this.multipleBonuses) {
      this.translationService.get('room-page.really-delete-token').subscribe(msg => {
        this.reallyDeleteText = msg;
      });
    } else {
      this.translationService.get('room-page.really-delete-tokens').subscribe(msg => {
        this.reallyDeleteText = msg;
      });
    }
    this.liveAnnouncer.announce(this.reallyDeleteText);
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
