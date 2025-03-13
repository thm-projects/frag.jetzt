import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConfirmDialogAction,
  ConfirmDialogType,
  LivepollConfirmationDialogComponent,
} from '../../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-livepoll-peer-instruction-window',
  templateUrl: './livepoll-peer-instruction-window.component.html',
  styleUrls: [
    './livepoll-peer-instruction-window.component.scss',
    '../../livepoll-common.scss',
  ],
  standalone: false,
})
export class LivepollPeerInstructionWindowComponent {
  title: string;
  description: string;
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
  ) {
    this.title = this.data.windowContext.is2ndPhasePeerInstruction
      ? 'common.confirmation-dialog.entries.change-peer-instruction-stage-2.title'
      : 'common.confirmation-dialog.entries.change-peer-instruction-stage.title';
    this.description = this.data.windowContext.is2ndPhasePeerInstruction
      ? 'common.confirmation-dialog.entries.change-peer-instruction-stage-2.description'
      : 'common.confirmation-dialog.entries.change-peer-instruction-stage.description';
  }

  nextPeerInstructionStep() {
    this.createConfirmationDialog(
      'change-peer-instruction-stage',
      ConfirmDialogType.AcceptCancel,
    ).subscribe((result) => {
      this.matDialogRef.close(!!result);
    });
  }

  private createConfirmationDialog(
    confirmationDialogId: string,
    type: ConfirmDialogType = ConfirmDialogType.AcceptCancel,
  ): Observable<ConfirmDialogAction> {
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
      data: {
        type,
      },
    });
    dialog.componentInstance.confirmationDialogId = confirmationDialogId;
    return dialog.afterClosed().pipe(take(1));
  }
}
