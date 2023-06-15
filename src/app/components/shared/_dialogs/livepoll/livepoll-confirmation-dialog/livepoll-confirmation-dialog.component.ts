import { Component } from '@angular/core';
import { DeviceInfoService } from '../../../../../services/util/device-info.service';
import { MatDialogRef } from '@angular/material/dialog';

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
  public textRef: string;
  public titleRef: string;

  constructor(
    public readonly device: DeviceInfoService,
    public readonly matDialogRef: MatDialogRef<
      LivepollConfirmationDialogComponent,
      boolean
    >,
  ) {}

  public accept() {
    this.matDialogRef.close(true);
  }

  public cancel() {
    this.matDialogRef.close(false);
  }
}
