import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConfirmDialogAction,
  ConfirmDialogType,
  LivepollConfirmationDialogComponent,
} from '../../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-livepoll-peer-instruction-window',
  templateUrl: './livepoll-peer-instruction-window.component.html',
  styleUrls: [
    './livepoll-peer-instruction-window.component.scss',
    '../../livepoll-common.scss',
  ],
})
export class LivepollPeerInstructionWindowComponent implements OnInit {
  constructor(
    public readonly dialog: MatDialog,
    public readonly matDialogRef: MatDialogRef<
      LivepollPeerInstructionWindowComponent,
      boolean
    >,
    public readonly translate: TranslateService,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: {
      windowContext: {
        is2ndPhasePeerInstruction: boolean;
      };
    },
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
