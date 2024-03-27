import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
export class LivepollConfirmationDialogComponent {
  public readonly translateKey: string = 'common';
  protected readonly ConfirmDialogType = ConfirmDialogType;
  protected readonly ConfirmDialogAction = ConfirmDialogAction;
  public confirmationDialogId: string | undefined;

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

  protected emitAction(action: ConfirmDialogAction) {
    this.matDialogRef.close(action);
  }
}
