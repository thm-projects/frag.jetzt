import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { GptService } from 'app/services/http/gpt.service';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { ReplaySubject, takeUntil } from 'rxjs';

interface ConversationEntry {
  type: 'human' | 'gpt';
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
  }

  refreshGPTMessage(index: number) {
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
            message: d.choices[0].text,
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
    this.gptService
      .requestCompletion({
        prompt: this.conversation.map((entry) => entry.message),
      })
      .subscribe({
        next: (d) => {
          this.addToConversation({
            message: d.choices[0].text,
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

  private loadConversation() {
    this.conversation = JSON.parse(
      sessionStorage.getItem('gpt-conversation') ?? '[]',
    );
  }

  private updateConversationEntry(index: number, entry: ConversationEntry) {
    this.conversation[index] = entry;
    sessionStorage.setItem(
      'gpt-conversation',
      JSON.stringify(this.conversation),
    );
  }

  private addToConversation(entry: ConversationEntry) {
    this.conversation.push(entry);
    sessionStorage.setItem(
      'gpt-conversation',
      JSON.stringify(this.conversation),
    );
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
