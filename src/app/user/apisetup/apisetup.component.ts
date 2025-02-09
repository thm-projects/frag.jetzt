import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import {
  AssistantAPIService,
  ProviderSetting,
} from 'app/room/assistant-route/services/assistant-api.service';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { CreateAPIProviderComponent } from './create-apiprovider/create-apiprovider.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NotificationService } from 'app/services/util/notification.service';

@Component({
  selector: 'app-apisetup',
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './apisetup.component.html',
  styleUrl: './apisetup.component.scss',
})
export class APISetupComponent {
  private mode = signal<'user' | 'admin'>('user');
  protected settings = signal<ProviderSetting[]>([]);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private apiService = inject(AssistantAPIService);
  private notify = inject(NotificationService);

  constructor() {
    const sub = applyDefaultNavigation(this.injector).subscribe();
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    effect((onCleanup) => {
      const mode = this.mode();
      if (!mode) return;
      const obs1 =
        mode === 'user'
          ? this.apiService.listSettings()
          : this.apiService.listAdminSettings();
      const sub1 = obs1.subscribe((data) => this.settings.set(data));
      onCleanup(() => {
        sub1.unsubscribe();
      });
    });
  }

  protected listKeys(setting: ProviderSetting) {
    const obj = JSON.parse(setting.json_settings || '{}');
    const keys = [];
    const recurse = (obj: Record<string, unknown>, prefix: string) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          recurse(
            obj[key] as Record<string, unknown>,
            prefix ? `${prefix}.${key}` : key,
          );
        } else {
          keys.push(prefix ? `${prefix}.${key}` : key);
        }
      }
    };
    recurse(obj, '');
    return keys.join(', ');
  }

  protected deleteSetting(setting: ProviderSetting) {
    const mode = this.mode();
    const obs =
      mode === 'user'
        ? this.apiService.deleteSetting(setting.id)
        : this.apiService.deleteAdminSetting(setting.id);
    obs.subscribe({
      next: () => this.settings.update((v) => v.filter((e) => e !== setting)),
      error: () => this.notify.show(i18n().global.changesGoneWrong),
    });
  }

  protected editSetting(setting: ProviderSetting) {
    const ref = CreateAPIProviderComponent.open(
      this.dialog,
      this.mode(),
      setting,
    );
    ref.afterClosed().subscribe((newSetting) => {
      if (!newSetting) {
        return;
      }
      this.settings.update((values) =>
        values.map((e) => (e === setting ? newSetting : e)),
      );
    });
  }

  protected addProvider() {
    const ref = CreateAPIProviderComponent.open(this.dialog, this.mode());
    ref.afterClosed().subscribe((newSetting) => {
      if (!newSetting) {
        return;
      }
      this.settings.update((values) => [...values, newSetting]);
    });
  }
}
