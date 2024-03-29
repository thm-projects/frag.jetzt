import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { Room } from 'app/models/room';
import {
  GptService,
  StreamTextCompletion,
} from 'app/services/http/gpt.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { finalize, Observer, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { GptOptInPrivacyComponent } from 'app/components/shared/_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { FormControl } from '@angular/forms';
import { GPTPromptPreset } from 'app/models/gpt-prompt-preset';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';

interface ConversationEntry {
  type: 'human' | 'gpt' | 'error';
  message: string;
}

@Component({
  selector: 'app-gpt-chat',
  templateUrl: './gpt-chat.component.html',
  styleUrls: ['./gpt-chat.component.scss'],
})
export class GptChatComponent implements OnInit, OnDestroy {
  @ViewChild('autoGrowElement')
  autoGrowElement: ElementRef<HTMLTextAreaElement>;
  conversation: ConversationEntry[] = [];
  sendGPTContent: string = '';
  isSending = false;
  renewIndex = null;
  isLoading = true;
  error = null;
  tokenInfo = {
    conversationTokens: '?' as string | number,
    promptTokens: '?' as string | number,
    allTokens: '?' as string | number,
  };
  stopper = new Subject<boolean>();
  isGPTPrivacyPolicyAccepted: boolean = false;
  prompts: GPTPromptPreset[] = [];
  promptFormControl = new FormControl('');
  filteredPrompts: GPTPromptPreset[];
  amountOfFoundActs: number = 0;
  amountOfFoundPrompts: number = 0;
  searchTerm: string = '';
  temperature = 0.7;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private _destroyer = new ReplaySubject(1);

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private deviceState: DeviceStateService,
    private gptEncoderService: GptEncoderService,
    public dialog: MatDialog,
    private location: Location,
    private accountState: AccountStateService,
  ) {}

  ngOnInit(): void {
    this.loadConversation();
    this.initAdmin();
    this.gptEncoderService.getEncoderOnce().subscribe((e) => {
      this.encoder = e;
      this.calculateTokens();
    });

    this.accountState.gptConsented$
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => {
        this.isGPTPrivacyPolicyAccepted = state;
        this.openPrivacyDialog();
      });
  }

  openPrivacyDialog() {
    if (this.isGPTPrivacyPolicyAccepted) {
      return;
    }
    const dialogRef = this.dialog.open(GptOptInPrivacyComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.accountState.updateGPTConsentState(result);
      if (!result) {
        this.location.back();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  formatText(text: string) {
    return text.replace(/\n/g, '<br>');
  }

  autoGrow(elem: HTMLTextAreaElement) {
    this.calculateTokens();
    elem.focus();
    setTimeout(() => {
      if (elem.scrollHeight > elem.clientHeight) {
        elem.style.height = `${elem.scrollHeight}px`;
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) {
      return;
    }
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter)) {
      const hasModifier =
        event.getModifierState('Meta') ||
        event.getModifierState('Alt') ||
        event.getModifierState('AltGraph') ||
        event.getModifierState('Control') ||
        event.getModifierState('Shift');
      event.preventDefault();
      if (hasModifier === this.deviceState.isMobile()) {
        this.sendGPTMessage();
        return;
      }
      this.sendGPTContent += '\n';
      this.autoGrow(event.target as HTMLTextAreaElement);
    }
  }

  clearMessages() {
    this.conversation = [];
    this.calculateTokens();
    this.saveConversation();
  }

  refreshGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = index;
    this.conversation[index] = {
      message: '',
      type: 'gpt',
    };
    this.gptService
      .requestStreamCompletion({
        prompt: [this.generatePrompt(index)],
        roomId: this.room?.id || null,
        model: 'text-davinci-003',
      })
      .pipe(
        takeUntil(this.stopper),
        finalize(() => {
          this.isSending = false;
          this.renewIndex = -1;
          this.saveConversation();
        }),
      )
      .subscribe(this.generateObserver(index));
  }

  sendGPTMessage() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = -1;
    const lastType =
      this.conversation[this.conversation.length - 1]?.type || 'error';
    const hasContent = this.sendGPTContent.trim().length > 0;
    if (lastType === 'human') {
      if (hasContent) {
        this.conversation.push({
          message: '',
          type: 'gpt',
        });
        this.addToConversation({
          message: this.sendGPTContent,
          type: 'human',
        });
      }
    } else {
      this.addToConversation({
        message: this.sendGPTContent,
        type: 'human',
      });
    }
    this.sendGPTContent = '';
    this.calculateTokens();
    const index = this.conversation.length;
    this.conversation.push({
      message: '',
      type: 'gpt',
    });
    this.gptService
      .requestStreamCompletion({
        prompt: [this.generatePrompt(index)],
        roomId: this.room?.id || null,
        model: 'text-davinci-003',
      })
      .subscribe(this.generateObserver(index));
  }

  getError() {
    return this.error instanceof String
      ? this.error
      : JSON.stringify(this.error);
  }

  private initAdmin() {
    this.gptService.getStatus().subscribe({
      next: (data) => {
        if (data.restricted) {
          this.error = 'Restricted';
          this.translateService
            .get('gpt-chat.input-forbidden')
            .subscribe((msg) => (this.error = msg));
        } else if (!data.apiKeyPresent) {
          this.error = 'No API Key';
          this.translateService
            .get('gpt-chat.no-api-setup')
            .subscribe((msg) => (this.error = msg));
        }
        this.isLoading = false;
        this.gptService.getGlobalPrompts().subscribe((data) => {
          this.prompts = data;
          this.filterPrompts();
        });
      },
      error: (err) => {
        console.error(err);
        this.error = err;
      },
    });
  }

  private generatePrompt(length: number = this.conversation.length): string {
    let wasHuman = false;
    let wasEmpty = false;
    return (
      this.conversation
        .slice(0, length)
        .filter((e) => e.type !== 'error')
        .reduce((acc, current, i) => {
          if (wasEmpty) {
            wasEmpty = false;
            return;
          }
          if (current.message.trim().length < 1) {
            if ((this.conversation[i + 1]?.message?.trim()?.length || 1) < 1) {
              wasEmpty = true;
              return;
            }
          }
          const isHuman = current.type === 'human';
          if (isHuman === wasHuman) {
            acc.push('');
          }
          acc.push(current.message);
          wasHuman = isHuman;
          return acc;
        }, [])
        .join('\u0003') + '\u0003'
    );
  }

  private generateObserver(
    index: number,
  ): Partial<Observer<StreamTextCompletion>> {
    return {
      next: (msg) => {
        if ('choices' in msg) {
          const firstChoice = msg.choices.find((choice) => choice.index === 0);
          if (!firstChoice) {
            return;
          }
          this.conversation[index] = {
            message: this.conversation[index].message + firstChoice.text,
            type: 'gpt',
          };
          this.calculateTokens();
        } else {
          this.calculateTokens();
          this.saveConversation();
          this.isSending = false;
          this.autoGrowElement.nativeElement.focus();
        }
      },
      error: (e) => {
        const errorIndex = index + 1;
        const error = this.conversation[errorIndex];
        let errorMessage = e.message ? e.message : e;
        if (e instanceof HttpErrorResponse) {
          const data = JSON.parse(e.error || null);
          errorMessage = data?.message ? data.message : errorMessage;
        }
        const isError = error?.type === 'error';
        const pre = isError ? error.message + '\n\n' : '';
        this.conversation.splice(errorIndex, Number(isError), {
          type: 'error',
          message: pre + 'ERROR: ' + errorMessage,
        });
        this.isSending = false;
      },
    };
  }

  private loadConversation() {
    this.conversation = JSON.parse(
      sessionStorage.getItem('gpt-conversation-admin') ?? '[]',
    );
  }

  private saveConversation() {
    sessionStorage.setItem(
      'gpt-conversation-admin',
      JSON.stringify(this.conversation.filter((e) => e.type !== 'error')),
    );
  }

  private updateConversationEntry(index: number, entry: ConversationEntry) {
    this.conversation[index] = entry;
    this.saveConversation();
  }

  private addToConversation(entry: ConversationEntry) {
    this.conversation.push(entry);
    this.saveConversation();
  }

  private calculateTokens() {
    if (this.encoder == null) {
      return;
    }
    const endOfText = '\u0003';
    let cToken;
    if (this.conversation.length < 1) {
      cToken = 0;
    } else {
      cToken = this.encoder.encode(
        this.conversation.map((c) => c.message).join(endOfText) + endOfText,
      ).length;
    }
    const pToken = this.encoder.encode(this.sendGPTContent + endOfText).length;
    this.tokenInfo = {
      conversationTokens: cToken,
      promptTokens: pToken,
      allTokens: pToken + cToken,
    };
  }

  private filterPrompts() {
    this.filteredPrompts = [];

    this.filteredPrompts.push({ act: 'acts', prompt: null } as GPTPromptPreset);
    this.filteredPrompts.push(
      ...this.prompts.filter((prompt) => {
        return (
          prompt.act.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
        );
      }),
    );
    this.amountOfFoundActs = this.filteredPrompts.length - 1;

    if (!this.searchTerm.trim()) {
      return;
    }

    this.filteredPrompts.push({
      act: 'prompts',
      prompt: null,
    } as GPTPromptPreset);

    this.filteredPrompts.push(
      ...this.prompts
        .filter((prompt) => {
          return (
            (
              prompt.prompt
                .toLowerCase()
                .match(this.searchTerm.toLowerCase()) || []
            ).length > 0
          );
        })
        .sort(
          (a, b) =>
            b.prompt.toLowerCase().split(this.searchTerm.toLowerCase()).length -
            1 -
            (a.prompt.toLowerCase().split(this.searchTerm.toLowerCase())
              .length -
              1),
        ),
    );
    this.amountOfFoundPrompts =
      this.filteredPrompts.length - this.amountOfFoundActs - 2;
  }
}
