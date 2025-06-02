import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormBuilder,
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
import { MatListModule } from '@angular/material/list';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { language } from 'app/base/language/language';
import {
  ListModelService,
  Model,
  Provider,
} from 'app/room/assistant-route/services/list-model.service';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AssistantAPIService,
  InputAPIModelInfo,
  ProviderInfos,
} from 'app/room/assistant-route/services/assistant-api.service';
import { NotificationService } from 'app/services/util/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ScrollIntoViewDirective } from 'app/directives/scroll-into-view.directive';
import { MatInputModule } from '@angular/material/input';

const PROVIDER_MAP = {
  Together: 'together',
  Fireworks: 'fireworks',
  Google: 'google-genai',
  'Amazon Bedrock': 'bedrock',
  Anthropic: 'anthropic',
  Mistral: 'mistral',
  OpenAI: 'openai',
  AI21: 'ai21',
  Cohere: 'cohere',
};

const SORT = {
  time: (a: Model, b: Model) => {
    const t = b.created - a.created;
    if (t !== 0) return t;
    return b.name.localeCompare(a.name);
  },
  name: (a: Model, b: Model) => {
    const n = a.name.localeCompare(b.name);
    if (n !== 0) return n;
    return b.created - a.created;
  },
  price: (a: Model, b: Model) => {
    const vb = parseFloat(b.pricing.prompt) + parseFloat(b.pricing.completion);
    const va = parseFloat(a.pricing.prompt) + parseFloat(a.pricing.completion);
    if (va !== vb) return va - vb;
    return b.created - a.created;
  },
  inputPrice: (a: Model, b: Model) => {
    const va = parseFloat(a.pricing.prompt);
    const vb = parseFloat(b.pricing.prompt);
    if (va !== vb) return va - vb;
    return b.created - a.created;
  },
  outputPrice: (a: Model, b: Model) => {
    const va = parseFloat(a.pricing.completion);
    const vb = parseFloat(b.pricing.completion);
    if (va !== vb) return va - vb;
    return b.created - a.created;
  },
};

@Component({
  selector: 'app-apimodel-from-list',
  imports: [
    MatDialogModule,
    MatStepperModule,
    ReactiveFormsModule,
    FormsModule,
    MatListModule,
    MatButtonModule,
    ContextPipe,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './apimodel-from-list.component.html',
  styleUrl: './apimodel-from-list.component.scss',
})
export class APIModelFromListComponent {
  protected mode = input.required<'user' | 'admin'>();
  protected models = signal<Model[]>([]);
  private listModel = inject(ListModelService);
  private formBuilder = inject(FormBuilder);
  protected modelGroup = this.formBuilder.group({
    model: [[] as string[], Validators.required],
  });
  private stepper = viewChild<MatStepper>('stepper');
  protected endpoints = signal<Provider[]>([]);
  protected providerGroup = this.formBuilder.group({
    provider: [[] as Provider[], Validators.required],
  });
  protected readonly i18n = i18n;
  protected readonly modelFilter = signal<string>('time');
  protected readonly modelSearch = model('');
  protected readonly sortedModels = computed(() => {
    const search = this.modelSearch().toLowerCase();
    const filter = this.modelFilter();
    let models = this.models();
    if (search) {
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(search) ||
          model.id.toLowerCase().includes(search),
      );
    } else {
      models = [...models];
    }
    if (!SORT[filter]) return models;
    return models.sort(SORT[filter]);
  });
  protected saving = signal(false);
  private apiService = inject(AssistantAPIService);
  private dialogRef = inject(MatDialogRef<APIModelFromListComponent>);
  private notify = inject(NotificationService);
  private providers = signal<ProviderInfos>(null);

  constructor() {
    this.listModel.listModels().subscribe((models) => {
      models.sort((a, b) => b.created - a.created);
      this.models.set(models);
    });
    this.apiService.listProviders().subscribe((providers) => {
      this.providers.set(providers);
    });
  }

  static open(
    dialog: MatDialog,
    mode: 'user' | 'admin',
  ): MatDialogRef<APIModelFromListComponent> {
    const ref = dialog.open(APIModelFromListComponent);
    ref.componentRef.setInput('mode', mode);
    return ref;
  }

  protected next() {
    const stepper = this.stepper();
    if (stepper.selectedIndex === 0) {
      stepper.next();
      return;
    }
    if (this.providerGroup.invalid) {
      this.providerGroup.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const model = this.modelGroup.value.model[0];
    const provider = this.providerGroup.value.provider[0];
    const modelInfo = this.models().find((m) => m.id === model);
    const providers = this.providers();
    if (
      provider.pricing.prompt.startsWith('-') ||
      provider.pricing.completion.startsWith('-') ||
      !providers
    ) {
      this.saving.set(false);
      this.notify.show(i18n().invalidParameters);
      return;
    }
    const supported_parameters = Object.keys(
      providers[PROVIDER_MAP[provider.provider_name]].optional,
    );
    const input = {
      model_name: modelInfo.id.split('/').at(-1),
      provider: PROVIDER_MAP[provider.provider_name],
      configurable_fields: supported_parameters,
      input_token_cost: provider.pricing.prompt,
      output_token_cost: provider.pricing.completion,
      currency: 'USD',
      max_tokens: provider.max_completion_tokens,
      max_context_length: provider.context_length,
    } satisfies InputAPIModelInfo;
    const obs =
      this.mode() === 'user'
        ? this.apiService.createModelInfo(input)
        : this.apiService.createAdminModelInfo(input);
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

  protected onChange(index: number) {
    if (index < 1) return;
    this.listModel
      .getProviders(this.modelGroup.value.model[0])
      .subscribe((providers) => {
        this.endpoints.set(providers);
      });
  }

  protected formatNumber(value: string): string {
    const num = parseFloat(value) * 1_000_000;
    return num.toLocaleString(language(), {
      currency: 'USD',
      currencyDisplay: 'symbol',
      style: 'currency',
    });
  }

  protected isAvailable(endpoint: Provider): boolean {
    // Chutes, DeepInfra, Google AI Studio, xAI
    return Boolean(PROVIDER_MAP[endpoint.provider_name]);
  }
}
