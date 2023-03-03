import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { Room } from 'app/models/room';
import { GptService, GPTStreamResult } from 'app/services/http/gpt.service';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { SessionService } from 'app/services/util/session.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { finalize, Observer, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { GptOptInPrivacyComponent } from '../_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { Location } from '@angular/common';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

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
  model: string = 'text-davinci-003';
  stopper = new Subject<boolean>();

  // Hier mit false initialisiert
  isGPTPrivacyPolicyAccepted: boolean = false;

  private isAdmin = false;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private deviceInfo: DeviceInfoService,
    private gptEncoderService: GptEncoderService,
    private router: Router,
    private sessionService: SessionService,
    public dialog: MatDialog,
    private location: Location,
  ) {
    this.isAdmin = router.url.toLowerCase().startsWith('/admin/gpt-chat');

    // gptService.getConsentState().subscribe((state) => {
    //   this.isGPTPrivacyPolicyAccepted = state;
    //   console.log('hier startet gptService ' + this.isGPTPrivacyPolicyAccepted)
    // });
  }

  ngOnInit(): void {
    this.loadConversation();
    this.translateService
      .stream('gpt-chat.greetings')
      .pipe(takeUntil(this.destroyer))
      .subscribe((data) => (this.greetings = data));
    if (this.isAdmin) {
      this.initAdmin();
    } else {
      this.initNormal();
      this.sendGPTContent = sessionStorage.getItem('temp-gpt-text') || '';
    }
    this.gptEncoderService.getEncoderOnce().subscribe((e) => {
      this.encoder = e;
      this.calculateTokens();
    });

    this.gptService.getConsentState().subscribe((state) => {
      this.isGPTPrivacyPolicyAccepted = state;
      this.openPrivacyDialog();
      console.log('hier startet gptService ' + this.isGPTPrivacyPolicyAccepted);
    });
  }

  openPrivacyDialog() {
    this.gptService.updateConsentState(false).subscribe();

    console.log('openPrivacyDialog methode at start');
    if (this.isGPTPrivacyPolicyAccepted) {
      console.log('openPrivacyDialog bereits akzeptiert');
    }
    if (!this.isGPTPrivacyPolicyAccepted) {
      // prüfen ob bereits zugestimmt wurde
      // abfrage kommt aus dem backend
      console.log('openPrivacyDialog');
      const dialogRef = this.dialog.open(GptOptInPrivacyComponent);
      dialogRef.afterClosed().subscribe((result) => {
        this.gptService.updateConsentState(result).subscribe();
        this.gptService.getConsentState().subscribe((state) => {
          console.log(
            'hier startet gptService nach openDialog -> ' +
              state +
              ' <- state-Wert',
          );
          console.log(
            'hier startet gptService nach openDialog -> ' +
              result +
              ' <- result-Wert',
          );
        });
        if (!result) {
          this.location.back();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  formatText(text: string) {
    if (this.model === 'code-davinci-002') {
      return '``\n' + text + '\n``';
    }
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
        roomId: this.room?.id || null,
        model: this.model,
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
        prompt: messages.join('\u0003') + '\u0003',
        roomId: this.room?.id || null,
        model: this.model,
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
        prompt: this.generatePrompt(index),
        roomId: this.room?.id || null,
        model: this.model,
      })
      .subscribe(this.generateObserver(index));
  }

  getError() {
    return this.error instanceof String
      ? this.error
      : JSON.stringify(this.error);
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
        prompt:
          this.conversation.map((entry) => entry.message).join('\u0003') +
          '\u0003',
        roomId: this.room?.id || null,
        model: this.model,
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
      },
      error: (err) => {
        console.error(err);
        this.error = err;
      },
    });
  }

  private initNormal() {
    this.sessionService.getRoomOnce().subscribe((r) => (this.room = r));
    this.sessionService.getGPTStatusOnce().subscribe({
      next: (data) => {
        if (data.restricted) {
          this.error = 'Restricted';
          this.translateService
            .get('gpt-chat.input-forbidden')
            .subscribe((msg) => (this.error = msg));
        } else if (!data.hasAPI) {
          this.error = 'No API Key';
          this.translateService
            .get('gpt-chat.no-api-setup')
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
}
