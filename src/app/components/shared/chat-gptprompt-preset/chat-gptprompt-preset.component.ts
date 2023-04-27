import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { GPTPromptPreset } from 'app/models/gpt-prompt-preset';
import { GptService, PropmtPresetAdd } from 'app/services/http/gpt.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { NotificationService } from 'app/services/util/notification.service';
import { SessionService } from 'app/services/util/session.service';
import {
  MarkdownDelta,
  QuillUtils,
  StandardDelta,
} from 'app/utils/quill-utils';
import { escapeForRegex } from 'app/utils/regex-escape';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import {
  AVAILABLE_LANGUAGES,
  LanguageService,
} from 'app/services/util/language.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-chat-gptprompt-preset',
  templateUrl: './chat-gptprompt-preset.component.html',
  styleUrls: ['./chat-gptprompt-preset.component.scss'],
})
export class ChatGPTPromptPresetComponent implements OnInit {
  @ViewChild(ViewCommentDataComponent)
  commentData: ViewCommentDataComponent;
  readonly onDelete = this.delete.bind(this);
  readonly onCancel = this.cancel.bind(this);
  readonly onSave = this.save.bind(this);
  searchTerm: string = '';
  initDelta: StandardDelta = { ops: [] };
  tokenInfo = {
    promptTokens: 0,
  };
  amountOfFoundActs = 0;
  amountOfFoundPrompts = 0;
  filteredPrompts: GPTPromptPreset[] = [];
  isGlobal = false;
  language: string;
  temperature = 0.7;
  presencePenalty = 0;
  frequencyPenalty = 0;
  topP = 1;
  protected languages = AVAILABLE_LANGUAGES;
  private prompts: GPTPromptPreset[];
  private encoder: GPTEncoder;
  private selectedPrompt: GPTPromptPreset;
  private startLanguage: string;

  constructor(
    protected sessionService: SessionService,
    encoderService: GptEncoderService,
    private route: ActivatedRoute,
    private location: Location,
    private gptService: GptService,
    private tranlateService: TranslateService,
    private notificationService: NotificationService,
    languageService: LanguageService,
  ) {
    encoderService
      .getEncoderOnce()
      .subscribe((encoder) => (this.encoder = encoder));
    languageService
      .getLanguage()
      .pipe(take(1))
      .subscribe((lang) => {
        this.startLanguage = lang;
        this.language = lang;
      });
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.isGlobal = Boolean(data.superAdmin);
      this.initPrompts();
    });
  }

  setValue(prompt: GPTPromptPreset) {
    this.selectedPrompt = prompt;
    this.initDelta = QuillUtils.getDeltaFromMarkdown(
      (this.selectedPrompt?.prompt || '') as MarkdownDelta,
    );
    this.language = prompt?.language || this.startLanguage;
    this.temperature = prompt?.temperature || 0.7;
    this.presencePenalty = prompt?.presencePenalty || 0;
    this.frequencyPenalty = prompt?.frequencyPenalty || 0;
    this.topP = prompt?.topP || 1;
  }

  filterPrompts() {
    this.selectedPrompt = null;
    if (!this.searchTerm.trim()) {
      this.filteredPrompts = [...this.prompts];
      return;
    }
    this.filteredPrompts.length = 0;
    const searchRegex = new RegExp(
      '\\b' + escapeForRegex(this.searchTerm),
      'gi',
    );
    this.filteredPrompts.push({ act: 'acts', prompt: null } as GPTPromptPreset);
    const data = this.prompts
      .map(
        (x) =>
          [[...x.act.matchAll(searchRegex)].length, x] as [
            number,
            GPTPromptPreset,
          ],
      )
      .filter((x) => x[0] > 0);
    data.sort((a, b) => b[0] - a[0]);
    this.filteredPrompts.push(...data.map((x) => x[1]));
    this.amountOfFoundActs = this.filteredPrompts.length - 1;
    this.filteredPrompts.push({
      act: 'prompts',
      prompt: null,
    } as GPTPromptPreset);
    const promptData = this.prompts
      .map(
        (x) =>
          [[...x.prompt.matchAll(searchRegex)].length, x] as [
            number,
            GPTPromptPreset,
          ],
      )
      .filter((x) => x[0] > 0);
    promptData.sort((a, b) => b[0] - a[0]);
    this.filteredPrompts.push(...promptData.map((x) => x[1]));
    this.amountOfFoundPrompts =
      this.filteredPrompts.length - this.amountOfFoundActs - 2;
  }

  calculateTokens(text: string) {
    if (this.encoder == null) {
      return;
    }
    const endOfText = '\u0003';
    const pToken = this.encoder.encode(text + endOfText).length;
    this.tokenInfo = {
      promptTokens: pToken,
    };
  }

  getCurrentText() {
    const data = this.commentData?.currentData;
    if (!data) {
      return '';
    }
    return QuillUtils.getMarkdownFromDelta(data);
  }

  private initPrompts() {
    this.sessionService.onReady.subscribe(() => {
      if (this.isGlobal) {
        this.gptService.getGlobalPrompts().subscribe((data) => {
          this.prompts = data;
          this.filterPrompts();
        });
      } else {
        this.gptService.getPrompts().subscribe((data) => {
          this.prompts = data.filter((e) => Boolean(e.accountId));
          this.filterPrompts();
        });
      }
    });
  }

  private cancel() {
    this.location.back();
  }

  private delete() {
    if (!this.selectedPrompt) {
      this.tranlateService
        .get('chat-gptprompt-preset.no-prompt-selected')
        .subscribe((msg) =>
          this.notificationService.show(msg, undefined, {
            duration: 5000,
            panelClass: ['snackbar-warn'],
          }),
        );
      return;
    }
    this.gptService.deletePrompt(this.selectedPrompt.id).subscribe({
      next: () => {
        const index = this.prompts.indexOf(this.selectedPrompt);
        if (index >= 0) {
          this.prompts.splice(index, 1);
        }
        this.filterPrompts();
        this.setValue(null);
        this.tranlateService
          .get('chat-gptprompt-preset.delete-success')
          .subscribe((msg) =>
            this.notificationService.show(msg, undefined, {
              duration: 5000,
              panelClass: ['snackbar-valid'],
            }),
          );
      },
      error: this.onError.bind(this),
    });
  }

  private onError(err: any) {
    this.tranlateService
      .get('chat-gptprompt-preset.an-error-occured')
      .subscribe((msg) =>
        this.notificationService.show(msg, undefined, {
          duration: 12_500,
          panelClass: ['snackbar', 'important'],
        }),
      );
  }

  private save() {
    const term = this.searchTerm.trim();
    const match = this.selectedPrompt?.act?.localeCompare?.(term) ?? -1;
    if (term.length < 1) {
      this.tranlateService
        .get('chat-gptprompt-preset.enter-prompt-name')
        .subscribe((msg) =>
          this.notificationService.show(msg, undefined, {
            duration: 5000,
            panelClass: ['snackbar-warn'],
          }),
        );
      return;
    }
    const hasSimilarElement = this.prompts.some(
      (x) => x.act.localeCompare(term) === 0 && x.language === this.language,
    );
    if (match === 0) {
      const newData = this.getCurrentText();
      const patch: Partial<PropmtPresetAdd> = {};
      if (newData.localeCompare(this.selectedPrompt.prompt) !== 0) {
        patch.prompt = newData;
      }
      if (this.language !== this.selectedPrompt.language) {
        if (hasSimilarElement) {
          this.tranlateService
            .get('chat-gptprompt-preset.already-present')
            .subscribe((msg) =>
              this.notificationService.show(msg, undefined, {
                duration: 12000,
                panelClass: ['snackbar-invalid'],
              }),
            );
          return;
        }
        patch.language = this.language;
      }
      if (this.temperature !== this.selectedPrompt.temperature) {
        patch.temperature = this.temperature;
      }
      if (this.presencePenalty !== this.selectedPrompt.presencePenalty) {
        patch.presencePenalty = this.presencePenalty;
      }
      if (this.frequencyPenalty !== this.selectedPrompt.frequencyPenalty) {
        patch.frequencyPenalty = this.frequencyPenalty;
      }
      if (this.topP !== this.selectedPrompt.topP) {
        patch.topP = this.topP;
      }
      if (Object.keys(patch).length < 1) {
        this.tranlateService
          .get('chat-gptprompt-preset.no-patch-needed')
          .subscribe((msg) =>
            this.notificationService.show(msg, undefined, {
              duration: 5000,
              panelClass: ['snackbar-warn'],
            }),
          );
        return;
      }
      this.gptService.patchPrompt(this.selectedPrompt.id, patch).subscribe({
        next: (data) => {
          const index = this.prompts.indexOf(this.selectedPrompt);
          if (index < 0) {
            this.onError('Index out of bounds');
            return;
          }
          this.prompts[index] = data;
          this.filterPrompts();
          this.setValue(data);
          this.tranlateService
            .get('chat-gptprompt-preset.patch-success')
            .subscribe((msg) =>
              this.notificationService.show(msg, undefined, {
                duration: 5000,
                panelClass: ['snackbar-valid'],
              }),
            );
        },
        error: this.onError.bind(this),
      });
      return;
    } else if (hasSimilarElement) {
      this.tranlateService
        .get('chat-gptprompt-preset.already-present')
        .subscribe((msg) =>
          this.notificationService.show(msg, undefined, {
            duration: 12000,
            panelClass: ['snackbar-invalid'],
          }),
        );
      return;
    }
    const adder = this.isGlobal
      ? this.gptService.addGlobalPrompt
      : this.gptService.addPrompt;
    adder
      .call(this.gptService, {
        act: term,
        prompt: this.getCurrentText(),
        language: this.language,
        temperature: this.temperature,
        presencePenalty: this.presencePenalty,
        frequencyPenalty: this.frequencyPenalty,
        topP: this.topP,
      })
      .subscribe({
        next: (data) => {
          this.prompts.push(data);
          this.filterPrompts();
          this.setValue(data);
          this.tranlateService
            .get('chat-gptprompt-preset.add-success')
            .subscribe((msg) =>
              this.notificationService.show(msg, undefined, {
                duration: 5000,
                panelClass: ['snackbar-valid'],
              }),
            );
        },
        error: this.onError.bind(this),
      });
  }
}
