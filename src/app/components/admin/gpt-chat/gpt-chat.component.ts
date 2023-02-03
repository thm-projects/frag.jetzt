import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GptService } from 'app/services/http/gpt.service';
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
  conversation: ConversationEntry[] = [];
  greetings: { [key: string]: string } = {};
  sendGPTContent: string = '';
  isSending = false;
  renewIndex = null;
  isLoading = true;
  error = null;
  private destroyer = new ReplaySubject(1);

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  formatText(text: string) {
    return text.replace(/\n/g, '<br>');
  }

  autoGrow(elem: HTMLTextAreaElement) {
    elem.focus();
    setTimeout(() => {
      if (elem.scrollHeight > elem.clientHeight) {
        elem.style.height = `${elem.scrollHeight}px`;
      }
    });
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
          this.conversation[index] = {
            message: d.choices[0].text,
            type: 'gpt',
          };
          this.isSending = false;
        },
        error: (e) => {
          console.error(e);
          this.conversation[index] = {
            message: 'ERROR: ' + (e?.message ? e.message : e),
            type: 'gpt',
          };
          this.isSending = false;
        },
      });
  }

  sendGPTMessage() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.conversation.push({
      message: this.sendGPTContent,
      type: 'human',
    });
    this.sendGPTContent = '';
    this.gptService
      .requestCompletion({
        prompt: this.conversation.map((entry) => entry.message),
      })
      .subscribe({
        next: (d) => {
          this.conversation.push({
            message: d.choices[0].text,
            type: 'gpt',
          });
          this.isSending = false;
        },
        error: (e) => {
          console.error(e);
          this.conversation.push({
            message: 'ERROR: ' + (e?.message ? e.message : e),
            type: 'gpt',
          });
          this.isSending = false;
        },
      });
  }
}
