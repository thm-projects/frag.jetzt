import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-export-format',
  templateUrl: './export-format.component.html',
  styleUrls: ['./export-format.component.scss']
})
export class ExportFormatComponent implements OnInit {

  exportType = 'comma';

  constructor(public dialogRef: MatDialogRef<Component>) { }

  ngOnInit() {
  }


  /**
   * Closes the dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildExportActionCallback(): () => void {
    return () => this.dialogRef.close(this.exportType);
  }
}
