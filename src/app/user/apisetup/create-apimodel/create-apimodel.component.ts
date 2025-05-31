import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, effect, inject, input, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  APIModelInfo,
  AssistantAPIService,
  InputAPIModelInfo,
  PatchAPIModelInfo,
  ProviderInfos,
} from 'app/room/assistant-route/services/assistant-api.service';
import { KeyValuePipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from 'app/services/util/notification.service';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-apimodel',
  imports: [
    MatDialogModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule,
    KeyValuePipe,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './create-apimodel.component.html',
  styleUrl: './create-apimodel.component.scss',
})
export class CreateAPIModelComponent {
  protected mode = input.required<'user' | 'admin'>();
  protected readonly i18n = i18n;
  protected saving = signal(false);
  protected inputModel = input<APIModelInfo>();
  private apiService = inject(AssistantAPIService);
  private formBuilder = inject(FormBuilder);
  protected form = this.formBuilder.group({
    model_name: [null as string, Validators.required],
    provider: [null as string, Validators.required],
    configurable_fields: this.formBuilder.array([]),
    input_token_cost: [0 as number, Validators.required],
    output_token_cost: [0 as number, Validators.required],
    currency: ['USD' as string, Validators.required],
    max_tokens: [null as number],
    max_context_length: [null as number],
  });
  protected currencies = signal<string[]>(['USD']);
  private notify = inject(NotificationService);
  protected newConfigurableField = this.formBuilder.control(
    '',
    Validators.required,
  );
  protected configurable_fields = this.form.get(
    'configurable_fields',
  ) as FormArray<FormControl<string>>;
  protected providers = signal<ProviderInfos>(null);
  private dialogRef = inject(MatDialogRef<CreateAPIModelComponent>);

  constructor() {
    this.apiService.listProviders().subscribe((providers) => {
      this.providers.set(providers);
    });
    effect(() => {
      const mode = this.mode();
      const model = this.inputModel();
      if (!mode || !model) return;
      const shouldHaveAccountId = mode === 'user';
      const hasAccountId = Boolean(model.account_id);
      if (shouldHaveAccountId !== hasAccountId) {
        this.dialogRef.close();
        this.notify.show(i18n().wrongOpened);
      }
    });
    effect(() => {
      const model = this.inputModel();
      if (!model) return;
      this.onModelInput(model);
    });
  }

  static open(dialog: MatDialog, mode: 'user' | 'admin', model?: APIModelInfo) {
    const ref = dialog.open(CreateAPIModelComponent, {
      disableClose: true,
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
    ref.componentRef.setInput('mode', mode);
    ref.componentRef.setInput('inputModel', model);
    return ref;
  }

  protected checkIsProvider(formValue, selectionValue) {
    return formValue === selectionValue;
  }

  protected removeFromArr(index: number) {
    this.configurable_fields.removeAt(index);
  }

  protected addToArr() {
    if (this.newConfigurableField.invalid) return;
    if (
      this.configurable_fields.value.includes(this.newConfigurableField.value)
    ) {
      this.notify.show(
        i18nContext(i18n().fieldPresent, {
          field: this.newConfigurableField.value,
        }),
      );
      return;
    }
    this.configurable_fields.push(
      this.formBuilder.control(
        this.newConfigurableField.value,
        Validators.required,
      ),
    );
    this.newConfigurableField.reset();
  }

  protected save() {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    const mode = this.mode();
    let obs: Observable<APIModelInfo>;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.saving.set(false);
      return;
    }
    const model_name = this.form.value.model_name?.trim();
    if (!model_name || model_name.length === 0) {
      this.notify.show(i18n().nameEmpty);
      this.saving.set(false);
      return;
    }
    const provider = this.form.value.provider;
    const configurable_fields = this.configurable_fields.value;
    const input_token_cost = this.toDecimal(this.form.value.input_token_cost);
    const output_token_cost = this.toDecimal(this.form.value.output_token_cost);
    const currency = this.form.value.currency;
    const max_tokens = this.form.value.max_tokens;
    const max_context_length = this.form.value.max_context_length;
    // create
    if (!this.inputModel()) {
      const input = {
        model_name,
        provider,
        configurable_fields,
        input_token_cost,
        output_token_cost,
        currency,
        max_tokens,
        max_context_length,
      } satisfies InputAPIModelInfo;
      obs =
        mode === 'user'
          ? this.apiService.createModelInfo(input)
          : this.apiService.createAdminModelInfo(input);
    } else {
      // patch
      const inputModel = this.inputModel();
      const changes: PatchAPIModelInfo = {
        id: inputModel.id,
      };
      let added = false;
      if (inputModel.model_name !== model_name) {
        changes.model_name = model_name;
        added = true;
      }
      if (inputModel.provider !== provider) {
        changes.provider = provider;
        added = true;
      }
      if (
        JSON.stringify(inputModel.configurable_fields) !==
        JSON.stringify(configurable_fields)
      ) {
        changes.configurable_fields = configurable_fields;
        added = true;
      }
      if (!this.areEqual(inputModel.input_token_cost, input_token_cost)) {
        changes.input_token_cost = input_token_cost;
        added = true;
      }
      if (!this.areEqual(inputModel.output_token_cost, output_token_cost)) {
        changes.output_token_cost = output_token_cost;
        added = true;
      }
      if (inputModel.currency !== currency) {
        changes.currency = currency;
        added = true;
      }
      if (inputModel.max_tokens !== max_tokens) {
        changes.max_tokens = max_tokens;
        added = true;
      }
      if (inputModel.max_context_length !== max_context_length) {
        changes.max_context_length = max_context_length;
        added = true;
      }
      if (!added) {
        this.notify.show(i18n().noChanges);
        this.dialogRef.close();
        this.saving.set(false);
        return;
      }
      obs =
        mode === 'user'
          ? this.apiService.patchModelInfo(changes)
          : this.apiService.patchAdminModelInfo(changes);
    }
    obs.subscribe({
      next: (setting) => {
        this.saving.set(false);
        this.dialogRef.close(setting);
        this.notify.show(i18n().global.changeSuccessful);
      },
      error: () => {
        this.saving.set(false);
        this.notify.show(i18n().global.changesGoneWrong);
      },
    });
  }

  private toDecimal(value: number): string {
    const s = value.toString();
    let index = s.indexOf('.');
    if (index === -1) {
      index = s.length;
    }
    // "divide" by 1_000_000
    const decimalPart = s.slice(index + 1);
    const beforeDecimal = s.slice(0, index);
    if (beforeDecimal.length > 6) {
      return (
        beforeDecimal.slice(0, -6) + '.' + beforeDecimal.slice(-6) + decimalPart
      );
    }
    return '0.' + beforeDecimal.padStart(6, '0') + decimalPart;
  }

  private fromDecimal(value: string): number {
    // Precision should be better here
    return parseFloat(value) * 1_000_000;
  }

  private areEqual(longNumber: string, shortNumber: string): boolean {
    return (
      Math.abs(parseFloat(longNumber) - parseFloat(shortNumber)) <=
      Number.EPSILON
    );
  }

  private onModelInput(model: APIModelInfo) {
    this.form.patchValue({
      model_name: model.model_name,
      provider: model.provider,
      input_token_cost: this.fromDecimal(model.input_token_cost),
      output_token_cost: this.fromDecimal(model.output_token_cost),
      currency: model.currency,
      max_tokens: model.max_tokens,
      max_context_length: model.max_context_length,
    });
    this.configurable_fields.clear();
    for (const field of model.configurable_fields) {
      this.configurable_fields.push(
        this.formBuilder.control(field, Validators.required),
      );
    }
  }
}
