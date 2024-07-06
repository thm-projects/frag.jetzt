import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { SessionService } from '../../../services/util/session.service';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';
import { MatDialog } from '@angular/material/dialog';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { user$ } from 'app/user/state/user';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss'],
})
export class NewLandingComponent {
  protected readonly i18n = i18n;

  constructor(
    public dialog: MatDialog,
    public sessionService: SessionService,
    private keyService: GPTAPISettingService,
    private voucherService: GPTVoucherService,
  ) {}

  openCreateRoomDialog(): void {
    user$
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
