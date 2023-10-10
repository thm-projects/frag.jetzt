import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum ConfirmDialogType {
  AcceptCancel,
  YesNoCancel,
}

export enum ConfirmDialogAction {
  Cancel,
  Yes,
  No,
  Accept,
}

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
  protected readonly ConfirmDialogType = ConfirmDialogType;
  protected readonly ConfirmDialogAction = ConfirmDialogAction;

  constructor(
    public readonly matDialogRef: MatDialogRef<
      LivepollConfirmationDialogComponent,
      ConfirmDialogAction
    >,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: {
      type: ConfirmDialogType;
    } = {
      type: ConfirmDialogType.AcceptCancel,
    },
  ) {}

  ngOnInit(): void {}

  protected emitAction(action: ConfirmDialogAction) {
    this.matDialogRef.close(action);
  }
}
