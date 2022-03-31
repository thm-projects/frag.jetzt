import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-remind-of-tokens',
  templateUrl: './remind-of-tokens.component.html',
  styleUrls: ['./remind-of-tokens.component.scss'],
})
export class RemindOfTokensComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<RemindOfTokensComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit() {

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
  buildLogoutActionCallback(): () => void {
    return () => this.close('logout');
  }
}
