import { Component, OnInit } from '@angular/core';
import { DeviceInfoService } from '../../../../../services/util/device-info.service';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

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

  constructor(
    public readonly device: DeviceInfoService,
    public readonly matDialogRef: MatDialogRef<
      LivepollConfirmationDialogComponent,
      boolean
    >,
  ) {}

  ngOnInit(): void {}

  accept() {
    this.matDialogRef.close(true);
  }

  cancel() {
    this.matDialogRef.close(false);
  }
}
