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
  untracked,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RestrictionsManageComponent } from 'app/room/assistant-route/restrictions-manage/restrictions-manage.component';
import {
  APIModelInfo,
  APISetup,
  AssistantAPIService,
  InputAPISetup,
  PatchAPISetup,
  ProviderSetting,
} from 'app/room/assistant-route/services/assistant-api.service';
import { AssistantRestrictionService } from 'app/room/assistant-route/services/assistant-restriction.service';
import { NotificationService } from 'app/services/util/notification.service';
import { UUID } from 'app/utils/ts-utils';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { language } from 'app/base/language/language';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-create-apisetup',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSelectModule,
    MatStepperModule,
    MatListModule,
    ContextPipe,
    FormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './create-apisetup.component.html',
  styleUrl: './create-apisetup.component.scss',
})
export class CreateAPISetupComponent {
  protected mode = input.required<'user' | 'admin'>();
  protected inputSetup = input.required<APISetup>();
  private formBuilder = inject(FormBuilder);
  protected selectedProviders = signal<string[]>([]);
  protected fetchedProviders = signal<ProviderSetting[]>([]);
  private fetchedModels = signal<APIModelInfo[]>([]);
  protected selectableModels = computed(() => {
    const models = this.fetchedModels();
    const providers = this.selectedProviders();
    return models.filter((model) => providers.includes(model.provider));
  });
  protected form = this.formBuilder.group({
    only_allowed_models: [true as boolean, Validators.required],
    pricing_strategy: [null as string, Validators.required],
    restriction_id: [null as UUID],
    allowed_providers_group: this.formBuilder.group({
      providers: [[] as ProviderSetting[], Validators.required],
    }),
    allowed_models_group: this.formBuilder.group({
      models: [[] as APIModelInfo[]],
    }),
  });
  protected readonly i18n = i18n;
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private apiService = inject(AssistantAPIService);
  private readonly restriction = inject(AssistantRestrictionService);
  private dialogRef = inject(MatDialogRef<CreateAPISetupComponent>);
  protected saving = signal(false);
  private _fetchedProviders: ProviderSetting['id'][] = [];
  private _fetchedModels: APIModelInfo['id'][] = [];

  constructor() {
    effect(() => {
      const mode = this.mode();
      const obs =
        mode === 'user'
          ? this.apiService.listSettings()
          : this.apiService.listAdminSettings();
      const obsModels =
        mode === 'user'
          ? this.apiService.listModelInfos()
          : this.apiService.listAdminModelInfos();
      obs.subscribe({
        next: (settings) => {
          this.fetchedProviders.set(settings);
        },
      });
      obsModels.subscribe({
        next: (models) => {
          this.fetchedModels.set(models);
        },
      });
    });
    effect((onCleanup) => {
      const setup = this.inputSetup();
      this._fetchedProviders.length = 0;
      this._fetchedModels.length = 0;
      if (!setup) return;
      const clean = this.onInputSetup(setup);
      onCleanup(() => {
        clean();
      });
    });
  }

  static open(dialog: MatDialog, mode: 'user' | 'admin', setup?: APISetup) {
    const ref = dialog.open(CreateAPISetupComponent, {
      disableClose: true,
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
    ref.componentRef.setInput('mode', mode);
    ref.componentRef.setInput('inputSetup', setup);
    return ref;
  }

  protected getGroup(name: 'allowed_providers_group' | 'allowed_models_group') {
    return this.form.get(name) as FormGroup;
  }

  protected listKeys(json: string): string {
    return Object.keys(JSON.parse(json || '{}')).join(', ');
  }

  protected save() {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    if (this.form.invalid) {
      this.saving.set(false);
      return;
    }
    const only_allowed_models = this.form.get('only_allowed_models').value;
    const pricing_strategy = this.form.get('pricing_strategy').value;
    const restriction_id = this.form.get('restriction_id').value;
    const allowed_providers = this.getGroup('allowed_providers_group')
      .get('providers')
      .value.map((p) => p.id);
    const allowed_models = this.getGroup('allowed_models_group')
      .get('models')
      .value.map((m) => m.id);
    let obs: Observable<APISetup>;
    let changed = false;
    // create new setup
    if (!this.inputSetup()) {
      const setup = {
        only_allowed_models,
        pricing_strategy,
        restriction_id,
      } satisfies InputAPISetup;
      obs =
        this.mode() === 'user'
          ? this.apiService.createSetup(setup)
          : this.apiService.createAdminSetup(setup);
      changed = true;
    } else {
      const old = this.inputSetup();
      const patch: PatchAPISetup = {
        id: old.id,
      };
      if (old.only_allowed_models !== only_allowed_models) {
        patch.only_allowed_models = only_allowed_models;
        changed = true;
      }
      if (old.pricing_strategy !== pricing_strategy) {
        patch.pricing_strategy = pricing_strategy;
        changed = true;
      }
      if (old.restriction_id !== restriction_id) {
        patch.restriction_id = restriction_id;
        changed = true;
      }
      if (changed) {
        obs =
          this.mode() === 'user'
            ? this.apiService.patchSetup(patch)
            : this.apiService.patchAdminSetup(patch);
      } else {
        obs = of(old);
      }
    }
    const makeDiff = (
      oldArr: UUID[],
      newArr: UUID[],
      setting_id: UUID,
      addOp: (setting_id: UUID, id: UUID) => Observable<unknown>,
      removeOp: (setting_id: UUID, id: UUID) => Observable<unknown>,
    ): Observable<unknown>[] => {
      const oldSet = new Set(oldArr);
      const newSet = new Set(newArr);
      return [
        ...newArr
          .filter((item) => !oldSet.has(item))
          .map((id) => addOp(setting_id, id)),
        ...oldArr
          .filter((item) => !newSet.has(item))
          .map((id) => removeOp(setting_id, id)),
      ];
    };
    obs
      .pipe(
        switchMap((setup) => {
          const setting_id = setup.id;
          const obsProviders = makeDiff(
            this._fetchedProviders,
            allowed_providers,
            setting_id,
            (setting_id, id) =>
              this.mode() === 'user'
                ? this.apiService.linkProviderToSetup(setting_id, id)
                : this.apiService.linkAdminProviderToSetup(setting_id, id),
            (setting_id, id) =>
              this.mode() === 'user'
                ? this.apiService.unlinkProviderFromSetup(setting_id, id)
                : this.apiService.unlinkAdminProviderFromSetup(setting_id, id),
          );
          const obsModels = makeDiff(
            this._fetchedModels,
            allowed_models,
            setting_id,
            (setting_id, id) =>
              this.mode() === 'user'
                ? this.apiService.linkModelInfoToSetup(setting_id, id)
                : this.apiService.linkAdminModelInfoToSetup(setting_id, id),
            (setting_id, id) =>
              this.mode() === 'user'
                ? this.apiService.unlinkModelInfoFromSetup(setting_id, id)
                : this.apiService.unlinkAdminModelInfoFromSetup(setting_id, id),
          );
          if (obsProviders.length === 0 && obsModels.length === 0) {
            return of(setup);
          }
          changed = true;
          return forkJoin([...obsProviders, ...obsModels]).pipe(
            map(() => setup),
          );
        }),
      )
      .subscribe({
        next: (setup) => {
          this.saving.set(false);
          if (!changed) {
            this.notify.show(i18n().noChanges);
            this.dialogRef.close();
            return;
          }
          this.dialogRef.close(setup);
          this.notify.show(i18n().global.changeSuccessful);
        },
        error: () => {
          this.saving.set(false);
          this.notify.show(i18n().global.changesGoneWrong);
        },
      });
  }

  protected onNavigate(index: number): void {
    if (index === 1) {
      this.selectedProviders.set(
        this.getGroup('allowed_providers_group')
          .get('providers')
          .value.map((p) => p.provider),
      );
    }
  }

  protected close(): void {
    this.dialogRef.close();
    const restriction_id = this.form.controls['restriction_id'].value;
    if (!this.inputSetup()?.restriction_id && restriction_id) {
      this.deleteRestriction(false);
    }
  }

  protected addRestriction() {
    const ref = RestrictionsManageComponent.open(this.dialog, null, 'user');
    ref.afterClosed().subscribe((id) => {
      this.form.get('restriction_id').setValue(id);
    });
  }

  protected editRestriction() {
    const ref = RestrictionsManageComponent.open(
      this.dialog,
      this.form.get('restriction_id').value,
      'user',
    );
    ref.afterClosed().subscribe((id) => {
      if (!id) {
        return;
      }
      this.form.get('restriction_id').setValue(id);
    });
  }

  protected deleteRestriction(showInfo = true) {
    const id = this.form.get('restriction_id').value;
    this.restriction.deleteUserRestriction(id).subscribe({
      next: () => this.form.get('restriction_id').reset(),
      error: () => {
        if (showInfo) {
          this.notify.show(i18n().global.changesGoneWrong);
        }
      },
    });
  }

  protected formatNumber(value: string, currency: string): string {
    const num = parseFloat(value) * 1_000_000;
    return num.toLocaleString(language(), {
      currency,
      currencyDisplay: 'symbol',
      style: 'currency',
    });
  }

  private onInputSetup(setup: APISetup) {
    this.form.get('only_allowed_models').setValue(setup.only_allowed_models);
    this.form.get('pricing_strategy').setValue(setup.pricing_strategy);
    this.form.get('restriction_id').setValue(setup.restriction_id);
    this.form.get('allowed_providers_group').get('providers').reset();
    this.form.get('allowed_models_group').get('models').reset();
    const obsProviders =
      this.mode() === 'user'
        ? this.apiService.listSetupProviderLinks(setup.id)
        : this.apiService.listAdminSetupProviderLinks(setup.id);
    const obsModels =
      this.mode() === 'user'
        ? this.apiService.listSetupAllowedModels(setup.id)
        : this.apiService.listAdminSetupAllowedModels(setup.id);
    const sub1 = obsProviders.subscribe({
      next: (providers) => {
        this._fetchedProviders = providers.map(
          (p) => p.api_provider_setting_id,
        );
        this.getGroup('allowed_providers_group')
          .get('providers')
          .setValue(
            untracked(() => this.fetchedProviders()).filter((p) =>
              this._fetchedProviders.includes(p.id),
            ),
          );
      },
    });
    const sub2 = obsModels.subscribe({
      next: (models) => {
        this._fetchedModels = models.map((m) => m.api_model_info_id);
        this.getGroup('allowed_models_group')
          .get('models')
          .setValue(
            untracked(() => this.fetchedModels()).filter((m) =>
              this._fetchedModels.includes(m.id),
            ),
          );
      },
    });
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }
}
