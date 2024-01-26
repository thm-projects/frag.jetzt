import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SessionService } from '../../../services/util/session.service';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss'],
})
export class NewLandingComponent implements OnInit {
  constructor(
    public dialog: MatDialog,
    public sessionService: SessionService,
    private keyService: GPTAPISettingService,
    private voucherService: GPTVoucherService,
  ) {}

  ngOnInit() {}

  openCreateRoomDialog(): void {
    forkJoin([
      this.keyService.getKeys(),
      this.voucherService.getVouchers(),
    ]).subscribe(([apiKeys, vouchers]) => {
      MultiLevelDialogComponent.open(
        this.dialog,
        MULTI_LEVEL_ROOM_CREATE,
        generateRoom,
        {
          apiKeys,
          vouchers,
        },
      );
    });
  }
}
