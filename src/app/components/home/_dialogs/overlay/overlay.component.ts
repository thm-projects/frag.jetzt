import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {
  confirmButtonType: DialogConfirmActionButtonType;

  constructor(private dialogRef: MatDialogRef<OverlayComponent>) {
    this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  ngOnInit() {
  }

  showCookieModal() {
    this.dialogRef.close(true);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () =>  {
      this.showCookieModal();
    };
  }


}
