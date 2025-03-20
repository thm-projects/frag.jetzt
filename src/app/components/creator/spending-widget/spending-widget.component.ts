import { Component, Injector, Input } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
}
