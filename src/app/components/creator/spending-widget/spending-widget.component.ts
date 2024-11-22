import { Component, Injector, Input } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RoomStateService } from '../../../services/state/room-state.service';
import { first } from 'rxjs';
import { GPTRoomService } from '../../../services/http/gptroom.service';
import { QuotaService } from '../../../services/http/quota.service';
import { Room } from '../../../models/room';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-spending-widget',
  imports: [CurrencyPipe, NgIf, TranslateModule, MatCard],
  templateUrl: './spending-widget.component.html',
  styleUrl: './spending-widget.component.scss',
})
export class SpendingWidgetComponent {
  protected room: Room;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('room') set _room(room: Room) {
    this.room = room;
    this.revalidate();
  }
  roomQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

  moderatorQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

  participantQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

  constructor(protected injector: Injector) {}

  private revalidate() {
    this.injector
      .get(RoomStateService)
      .room$.pipe(first((e) => !!e))
      .subscribe((room) => {
        this.injector
          .get(GPTRoomService)
          .getByRoomId(room.id)
          .subscribe((gptRoom) => {
            const quotaService = this.injector.get(QuotaService);

            quotaService.get(gptRoom.roomQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.roomQuota.spent = quota.entries[0].counter / 10e7;
              this.roomQuota.limit = quota.entries[0].quota / 10e7;
              this.roomQuota.spentAsPercentage =
                (this.roomQuota.spent / this.roomQuota.limit) * 100;
            });

            quotaService.get(gptRoom.moderatorQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.moderatorQuota.spent = quota.entries[0].counter / 10e7;
              this.moderatorQuota.limit = quota.entries[0].quota / 10e7;
              this.moderatorQuota.spentAsPercentage =
                (this.moderatorQuota.spent / this.moderatorQuota.limit) * 100;
            });

            quotaService.get(gptRoom.participantQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.participantQuota.spent = quota.entries[0].counter / 10e7;
              this.participantQuota.limit = quota.entries[0].quota / 10e7;
              this.participantQuota.spentAsPercentage =
                (this.participantQuota.spent / this.participantQuota.limit) *
                100;
            });
          });
      });
  }
}
