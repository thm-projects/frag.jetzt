import { Component } from '@angular/core';
import { SessionService } from '../../../services/util/session.service';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';
import { MatDialog } from '@angular/material/dialog';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { AccountStateService } from 'app/services/state/account-state.service';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss'],
})
export class NewLandingComponent {
  constructor(
    public dialog: MatDialog,
    public sessionService: SessionService,
    private keyService: GPTAPISettingService,
    private voucherService: GPTVoucherService,
    private accountState: AccountStateService,
  ) {}

  openCreateRoomDialog(): void {
    this.accountState.user$
      .pipe(
        take(1),
        switchMap((user) => {
          return forkJoin([
            user ? this.keyService.getKeys() : of([]),
            user ? this.voucherService.getVouchers() : of([]),
          ]);
        }),
      )
      .subscribe(([apiKeys, vouchers]) => {
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
