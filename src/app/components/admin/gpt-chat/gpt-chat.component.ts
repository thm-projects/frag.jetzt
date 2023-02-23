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
import { GptService, GPTStreamResult } from 'app/services/http/gpt.service';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { finalize, Observer, ReplaySubject, Subject, takeUntil } from 'rxjs';

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
  greetings: { [key: string]: string } = {};
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
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private deviceInfo: DeviceInfoService,
    private gptEncoderService: GptEncoderService,
  ) {}

  ngOnInit(): void {
    this.loadConversation();
    this.translateService
      .stream('gpt-chat.greetings')
      .pipe(takeUntil(this.destroyer))
      .subscribe((data) => (this.greetings = data));
    this.gptService.getStatus().subscribe({
      next: (data) => {
        if (data.restricted) {
          this.error = 'Restricted';
          this.translateService
            .get('gpt-chat.input-forbidden')
            .subscribe((msg) => (this.error = msg));
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = err;
      },
    });
    this.gptEncoderService.getEncoderOnce().subscribe((e) => {
      this.encoder = e;
      this.calculateTokens();
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
      if (hasModifier === this.deviceInfo.isCurrentlyMobile) {
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
        prompt: this.generatePrompt(index),
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

  refreshWaitingGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = index;
    const messages = this.conversation.slice(0, index).map((e) => e.message);
    this.gptService
      .requestCompletion({
        prompt: messages,
      })
      .subscribe({
        next: (d) => {
          this.updateConversationEntry(index, {
            message: d.completion.choices[0].text,
            type: 'gpt',
          });
          this.isSending = false;
        },
        error: (e) => {
          console.error(e);
          this.updateConversationEntry(index, {
            message: 'ERROR: ' + (e?.message ? e.message : e),
            type: 'gpt',
          });
          this.isSending = false;
        },
      });
  }

  sendGPTMessage() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = -1;
    this.addToConversation({
      message: this.sendGPTContent,
      type: 'human',
    });
    this.sendGPTContent = '';
    this.calculateTokens();
    const index = this.conversation.length;
    this.conversation.push({
      message: '',
      type: 'gpt',
    });
    this.gptService
      .requestStreamCompletion({
        prompt: this.generatePrompt(index),
      })
      .subscribe(this.generateObserver(index));
  }

  getError() {
    return this.error instanceof String ? this.error : JSON.stringify(this.error);
  }

  sendWaitingGPTMessage() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = -1;
    this.addToConversation({
      message: this.sendGPTContent,
      type: 'human',
    });
    this.sendGPTContent = '';
    this.calculateTokens();
    this.gptService
      .requestCompletion({
        prompt: this.conversation.map((entry) => entry.message),
      })
      .subscribe({
        next: (d) => {
          this.addToConversation({
            message: d.completion.choices[0].text,
            type: 'gpt',
          });
          this.calculateTokens();
          this.isSending = false;
          this.autoGrowElement.nativeElement.focus();
        },
        error: (e) => {
          console.error(e);
          this.addToConversation({
            message: 'ERROR: ' + (e?.message ? e.message : e),
            type: 'gpt',
          });
          this.calculateTokens();
          this.isSending = false;
        },
      });
  }

  private generatePrompt(length: number = this.conversation.length): string[] {
    let wasHuman = false;
    let wasEmpty = false;
    return this.conversation
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
      }, []);
  }

  private generateObserver(index: number): Partial<Observer<GPTStreamResult>> {
    return {
      next: (msg) => {
        if ('text' in msg) {
          if (msg.index !== 0) {
            return;
          }
          this.conversation[index] = {
            message: this.conversation[index].message + msg.text,
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
      sessionStorage.getItem('gpt-conversation') ?? '[]',
    );
  }

  private saveConversation() {
    sessionStorage.setItem(
      'gpt-conversation',
      JSON.stringify(this.conversation.filter(e => e.type !== 'error')),
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
}
