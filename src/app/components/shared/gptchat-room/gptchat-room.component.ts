import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { Room } from 'app/models/room';
import { GptService, GPTStreamResult } from 'app/services/http/gpt.service';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { SessionService } from 'app/services/util/session.service';
import { UserManagementService } from 'app/services/util/user-management.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { QuillUtils, SerializedDelta } from 'app/utils/quill-utils';
import {
  BehaviorSubject,
  filter,
  finalize,
  Observer,
  ReplaySubject,
  Subject,
  takeUntil,
} from 'rxjs';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { GptOptInPrivacyComponent } from '../_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { IntroductionPromptGuideChatbotComponent } from '../_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot.component';

interface ConversationEntry {
  type: 'human' | 'gpt' | 'error';
  message: string;
}

@Component({
  selector: 'app-gptchat-room',
  templateUrl: './gptchat-room.component.html',
  styleUrls: ['./gptchat-room.component.scss'],
})
export class GPTChatRoomComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ViewCommentDataComponent)
  commentData: ViewCommentDataComponent;
  conversation: ConversationEntry[] = [];
  greetings: { [key: string]: string } = {};
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
  isGPTPrivacyPolicyAccepted: boolean = false;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private init = new BehaviorSubject(0);

  constructor(
    private gptService: GptService,
    private userManagementService: UserManagementService,
    private translateService: TranslateService,
    private deviceInfo: DeviceInfoService,
    private gptEncoderService: GptEncoderService,
    public sessionService: SessionService,
    public dialog: MatDialog,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.loadConversation();
    this.translateService
      .stream('gpt-chat.greetings')
      .pipe(takeUntil(this.destroyer))
      .subscribe((data) => (this.greetings = data));
    this.initNormal();
    this.gptEncoderService.getEncoderOnce().subscribe((e) => {
      this.encoder = e;
      this.calculateTokens(this.getCurrentText());
    });
    this.userManagementService
      .getGPTConsentState()
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => {
        setTimeout(() => this.init.next(this.init.value + 1), 500);
        this.isGPTPrivacyPolicyAccepted = state;
        this.openPrivacyDialog();
      });
    this.init.pipe(filter((state) => state === 3)).subscribe(() => {
      const str = sessionStorage.getItem('temp-gpt-text') || '[]';
      this.commentData.set(QuillUtils.deserializeDelta(str as SerializedDelta));
    });
  }

  setValue(msg: string) {
    if (!msg.endsWith('\n')) {
      msg += '\n';
    }
    this.commentData.set({ ops: [{ insert: msg }] });
  }

  ngAfterViewInit(): void {
    this.init.next(this.init.value + 1);
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
      this.userManagementService.updateGPTConsentState(result).subscribe();
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
    if (this.model === 'code-davinci-002') {
      return '``\n' + text + '\n``';
    }
    return text.replace(/\n/g, '<br>');
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
      //TODO
      // this.sendGPTContent += '\n';
    }
  }

  clearMessages() {
    this.conversation = [];
    this.calculateTokens(this.getCurrentText());
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

  sendGPTMessage() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.renewIndex = -1;
    const lastType =
      this.conversation[this.conversation.length - 1]?.type || 'error';
    const currentText = this.getCurrentText();
    const hasContent = currentText.trim().length > 0;
    if (lastType === 'human') {
      if (hasContent) {
        this.conversation.push({
          message: '',
          type: 'gpt',
        });
        this.addToConversation({
          message: currentText,
          type: 'human',
        });
      }
    } else {
      this.addToConversation({
        message: currentText,
        type: 'human',
      });
    }
    this.commentData.clear();
    this.calculateTokens(currentText);
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

  showPromptGuide() {
    this.dialog.open(IntroductionPromptGuideChatbotComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
  }

  private initNormal() {
    this.sessionService.onReady.subscribe(() => {
      this.init.next(this.init.value + 1);
    });
    this.sessionService.getRoomOnce().subscribe((r) => {
      this.room = r;
    });
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
        const currentText = this.getCurrentText();
        if ('text' in msg) {
          if (msg.index !== 0) {
            return;
          }
          this.conversation[index] = {
            message: this.conversation[index].message + msg.text,
            type: 'gpt',
          };
          this.calculateTokens(currentText);
        } else {
          this.calculateTokens(currentText);
          this.saveConversation();
          this.isSending = false;
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

  private addToConversation(entry: ConversationEntry) {
    this.conversation.push(entry);
    this.saveConversation();
  }

  private calculateTokens(text: string) {
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
    const pToken = this.encoder.encode(text + endOfText).length;
    this.tokenInfo = {
      conversationTokens: cToken,
      promptTokens: pToken,
      allTokens: pToken + cToken,
    };
  }

  private getCurrentText() {
    const data = this.commentData?.currentData;
    if (!data) {
      return '';
    }
    return QuillUtils.getMarkdownFromDelta(data);
  }
}
