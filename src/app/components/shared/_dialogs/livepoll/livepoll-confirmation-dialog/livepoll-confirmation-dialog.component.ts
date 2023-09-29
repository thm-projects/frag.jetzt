import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-livepoll-confirmation-dialog',
  templateUrl: './livepoll-confirmation-dialog.component.html',
  styleUrls: [
    './livepoll-confirmation-dialog.component.scss',
    '../livepoll-common.scss',
  ],
})
export class LivepollConfirmationDialogComponent implements OnInit {
  public readonly translateKey: string = 'common';
  public textRef: string;
  public titleRef: string;

  constructor(
    public readonly matDialogRef: MatDialogRef<
      LivepollConfirmationDialogComponent,
      boolean
    >,
  ) {}

  ngOnInit(): void {}

  public accept() {
    this.matDialogRef.close(true);
  }

  public cancel() {
    this.matDialogRef.close(false);
  }
}
