import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConfirmDialogAction,
  ConfirmDialogType,
  LivepollConfirmationDialogComponent,
} from '../../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-livepoll-peer-instruction-window',
  templateUrl: './livepoll-peer-instruction-window.component.html',
  styleUrls: ['./livepoll-peer-instruction-window.component.scss'],
})
export class LivepollPeerInstructionWindowComponent implements OnInit {
  constructor(
    public readonly dialog: MatDialog,
    public readonly matDialogRef: MatDialogRef<
      LivepollPeerInstructionWindowComponent,
      boolean
    >,
  ) {}

  ngOnInit(): void {}

  nextPeerInstructionStep() {
    this.createConfirmationDialog(
      'dialog-confirm-peerInstruction-show1stStageResults-title',
      'dialog-confirm-peerInstruction-show1stStageResults-description',
      ConfirmDialogType.AcceptCancel,
    ).subscribe((result) => {
      this.matDialogRef.close(!!result);
    });
  }

  private createConfirmationDialog(
    title: string,
    text: string,
    type: ConfirmDialogType = ConfirmDialogType.AcceptCancel,
  ): Observable<ConfirmDialogAction> {
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
      data: {
        type,
      },
    });
    dialog.componentInstance.titleRef = title;
    dialog.componentInstance.textRef = text;
    return dialog.afterClosed().pipe(take(1));
  }
}
