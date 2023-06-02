import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-gptchat-info',
  templateUrl: './gptchat-info.component.html',
  styleUrls: ['./gptchat-info.component.scss'],
})
export class GPTChatInfoComponent implements OnInit {
  readonly onCancel = this.cancel.bind(this);

  constructor(private dialogRef: MatDialogRef<GPTChatInfoComponent>) {}

  static open(dialog: MatDialog) {
    const ref = dialog.open(GPTChatInfoComponent);
    return ref;
  }

  ngOnInit(): void {}

  private cancel() {
    this.dialogRef.close();
  }
}
