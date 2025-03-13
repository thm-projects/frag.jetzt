import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject, Injector, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import {
  ModerationResult,
  SimpleAIService,
} from 'app/room/assistant-route/services/simple-ai.service';
import { ProfanityFilterService } from 'app/services/util/profanity-filter.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';

interface Summary {
  title: string;
  options: {
    key: string;
    value: string | boolean | number;
  }[];
}

@Component({
  selector: 'app-moderation-checker',
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    CdkTextareaAutosize,
    MatProgressBarModule,
    MatSelectModule,
    ContextPipe,
  ],
  templateUrl: './moderation-checker.component.html',
  styleUrl: './moderation-checker.component.scss',
})
export class ModerationCheckerComponent {
  protected readonly i18n = i18n;
  protected readonly moderationResult = signal<Summary[]>([]);
  protected readonly moderationResultFlagged = signal<boolean>(false);
  protected readonly oldModerationResult = signal<[string, boolean]>(null);
  protected readonly AVAILABLE_LANGS = [
    'ar',
    'cs',
    'da',
    'de',
    'en',
    'eo',
    'es',
    'fa',
    'fi',
    'fil',
    'fr',
    'fr-CA-u-sd-caqc',
    'hi',
    'hu',
    'it',
    'ja',
    'kab',
    'ko',
    'nl',
    'no',
    'pl',
    'pt',
    'ru',
    'sv',
    'th',
    'tlh',
    'tr',
    'zh',
  ] as const;
  protected readonly textControl = new FormControl('', [
    (control) => (control.value?.trim().length ? null : { error: true }),
  ]);
  protected readonly slideControl = new FormControl(false);
  protected readonly partialControl = new FormControl(false);
  protected readonly languageControl = new FormControl<boolean | string>(false);
  private simpleAI = inject(SimpleAIService);
  private profanityFilter = inject(ProfanityFilterService);

  static open(injector: Injector): MatDialogRef<ModerationCheckerComponent> {
    const ref = injector.get(MatDialog).open(ModerationCheckerComponent);
    return ref;
  }

  protected checkModeration() {
    if (this.textControl.invalid) return;
    const text = this.textControl.value.trim();
    this.simpleAI
      .moderateContent([text], this.slideControl.value)
      .subscribe((v) => {
        const res = this.makeSummary(v[0]);
        this.moderationResult.set(res[0]);
        this.moderationResultFlagged.set(res[1]);
      });
    const lang = this.languageControl.value;
    const filtered = this.profanityFilter.filterProfanityWords(
      text,
      this.partialControl.value,
      Boolean(lang),
      lang as string,
    );
    this.oldModerationResult.set(filtered);
  }

  protected onKeydown(event: KeyboardEvent) {
    this.textControl.markAsTouched();
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter)) {
      const hasModifier =
        event.getModifierState('Meta') ||
        event.getModifierState('Alt') ||
        event.getModifierState('AltGraph') ||
        event.getModifierState('Control') ||
        event.getModifierState('Shift');
      if (hasModifier === windowWatcher.isMobile()) {
        event.preventDefault();
        this.checkModeration();
        return;
      }
    }
  }

  private makeSummary(element: ModerationResult): [Summary[], boolean] {
    const summary: Summary[] = [];
    let isFlagged = false;
    const celadonSummary: Summary = {
      title: 'Celadon',
      options: [],
    };
    for (const key in element.celadon) {
      const value = element.celadon[key];
      celadonSummary.options.push({ key, value });
      if (value === 'Toxic') isFlagged = true;
    }
    summary.push(celadonSummary);
    if ('openai' in element) {
      const openaiSummary: Summary = {
        title: 'OpenAI',
        options: [],
      };
      for (const key in element.openai) {
        const value = element.openai[key];
        openaiSummary.options.push({ key, value });
        if (typeof value === 'number' && value > 0.4) isFlagged = true;
        if (typeof value === 'boolean') isFlagged = isFlagged || value;
      }
      summary.push(openaiSummary);
    }
    const detoxifySummary: Summary = {
      title: 'Detoxify',
      options: [],
    };
    for (const key in element.detoxify) {
      const value = element.detoxify[key];
      detoxifySummary.options.push({ key, value });
      if (value > 0.4) isFlagged = true;
    }
    summary.push(detoxifySummary);
    const sentimentSummary: Summary = {
      title: 'Sentiment',
      options: [
        {
          key: 'Positive',
          value: element.sentiment[0],
        },
        {
          key: 'Neutral',
          value: element.sentiment[1],
        },
        {
          key: 'Negative',
          value: element.sentiment[2],
        },
      ],
    };
    summary.push(sentimentSummary);
    return [summary, isFlagged];
  }
}
