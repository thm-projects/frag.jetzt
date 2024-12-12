import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { language } from 'app/base/language/language';
import { RoomCountChanged } from 'app/services/http/active-user.service';
import { RoomDataService } from 'app/services/util/room-data.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-room-activity',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './room-activity.component.html',
  styleUrl: './room-activity.component.scss',
})
export class RoomActivityComponent {
  expanded = input<boolean>(false);
  protected readonly i18n = i18n;
  private count = signal<RoomCountChanged | null>(null);
  protected participantCount = computed(() => {
    const c = this.count();
    if (!c) return '?';
    return c.participantCount.toLocaleString(language());
  });
  protected moderatorCount = computed(() => {
    const c = this.count();
    if (!c) return '?';
    return c.moderatorCount.toLocaleString(language());
  });
  protected hasCreator = computed(() => Boolean(this.count()?.creatorCount));
  private roomData = inject(RoomDataService);
  private subscriptions = effect((onCleanup) => {
    const sub1 = this.roomData
      .observeRoomCount()
      .subscribe((count) => this.count.set(count));
    onCleanup(() => sub1.unsubscribe());
  });
}
