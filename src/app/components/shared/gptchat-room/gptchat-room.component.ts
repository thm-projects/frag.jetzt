import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ComponentRef,
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
import {
  QuillUtils,
  SerializedDelta,
  StandardDelta,
} from 'app/utils/quill-utils';
import {
  finalize,
  Observer,
  ReplaySubject,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { GptOptInPrivacyComponent } from '../_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { IntroductionPromptGuideChatbotComponent } from '../_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot.component';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { GPTUserDescriptionDialogComponent } from '../_dialogs/gptuser-description-dialog/gptuser-description-dialog.component';
import { MatMenu } from '@angular/material/menu';
import {
  PresetsDialogComponent,
  PresetsDialogType,
} from '../_dialogs/presets-dialog/presets-dialog.component';
import { sys } from 'typescript';
import { GPTRoomPreset } from 'app/models/gpt-room-preset';
import {
  GPTRoomPresetLanguage,
  GPTRoomPresetLength,
  GPTRoomPresetTone,
} from '../../../models/gpt-room-preset';

interface ConversationEntry {
  type: 'human' | 'gpt' | 'error';
  message: string;
}

@Component({
  selector: 'app-gptchat-room',
  templateUrl: './gptchat-room.component.html',
  styleUrls: ['./gptchat-room.component.scss'],
})
export class GPTChatRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(ViewCommentDataComponent)
  commentData: ViewCommentDataComponent;
  @ViewChild('languageSubMenu') languageSubMenu: MatMenu;
  @ViewChild('toneSubMenu') toneSubMenu: MatMenu;
  @ViewChild('formalitySubMenu') formalitySubMenu: MatMenu;
  @ViewChild('lengthSubMenu') lengthSubMenu: MatMenu;
  @ViewChild('answerFormatSubMenu') answerFormatSubMenu: MatMenu;
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
  initDelta: StandardDelta;
  GPTRoomPresetLanguage = GPTRoomPresetLanguage;
  GPTRoomPresetLength = GPTRoomPresetLength;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private _list: ComponentRef<any>[];
  private preset: GPTRoomPreset;

  constructor(
    private gptService: GptService,
    private userManagementService: UserManagementService,
    private translateService: TranslateService,
    private deviceInfo: DeviceInfoService,
    private gptEncoderService: GptEncoderService,
    public sessionService: SessionService,
    public dialog: MatDialog,
    private location: Location,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    const str = sessionStorage.getItem('temp-gpt-text') || '[]';
    this.initDelta = QuillUtils.deserializeDelta(str as SerializedDelta);
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
        this.isGPTPrivacyPolicyAccepted = state;
        this.openPrivacyDialog();
      });
  }

  setValue(msg: string) {
    if (!msg.endsWith('\n')) {
      msg += '\n';
    }
    this.initDelta = { ops: [{ insert: msg }] };
  }

  ngAfterViewInit(): void {
    this.initNavigation();
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
    this._list?.forEach((e) => e.destroy());
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
      // do this on view comment data this.sendGPTContent += '\n';
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
    this.initDelta = { ops: [] };
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

  protected setLanguagePreset(language: GPTRoomPresetLanguage): void {
    this.gptService
      .getPreset(this.room.id)
      .pipe(tap((preset) => console.log(preset)));
    this.gptService.patchPreset(this.room.id, { language });
  }

  protected setTonePreset(tone: string): void {
    this.gptService
      .getPreset(this.room.id)
      .pipe(tap((preset) => console.log(preset)));
    const newTone = new GPTRoomPresetTone({ description: tone, active: true });
    this.gptService.patchPreset(this.room.id, { newTone });
  }

  protected setFormalityPreset(formality?: boolean): void {
    this.gptService
      .getPreset(this.room.id)
      .pipe(tap((preset) => console.log(preset)));
    this.gptService.patchPreset(this.room.id, { formality });
  }

  protected setLengthPreset(length: GPTRoomPresetLength): void {
    this.gptService
      .getPreset(this.room.id)
      .pipe(tap((preset) => console.log(preset)));
    this.gptService.patchPreset(this.room.id, { length });
  }

  protected setAnswerFormat(answerFormat: string): void {
    console.log('set answer format', answerFormat);
  }

  private initNormal() {
    this.sessionService.getRoomOnce().subscribe((r) => {
      this.room = r;
      this.gptService.getPreset(this.room.id).subscribe((preset) => {
        this.preset = preset;
      });
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

  private initNavigation(): void {
    /* eslint-disable @typescript-eslint/no-shadow */
    this._list = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'info',
          class: 'header-icons material-icons-outlined',
          text: 'header.prompt-guide',
          callback: () => this.showPromptGuide(),
          condition: () => true,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'assignment',
          class: 'material-icons-outlined',
          text: 'header.preset-context',
          callback: () => this.showContextPresetsDefinition(),
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'bookmark',
          class: 'material-icons-outlined',
          text: 'header.preset-topic',
          callback: () => this.showTopicPresetsDefinition(),
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'person',
          class: 'material-icons-outlined',
          text: 'header.preset-persona',
          callback: () => this.showPersonaPresetsDefinition(),
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'language',
          class: 'material-icons-outlined',
          menu: this.languageSubMenu,
          text: 'header.preset-language',
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'sentiment_satisfied',
          class: 'material-icons-outlined',
          menu: this.toneSubMenu,
          text: 'header.preset-tone',
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'work',
          class: 'material-icons-outlined',
          menu: this.formalitySubMenu,
          text: 'header.preset-formality',
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'straighten',
          class: 'material-icons-outlined',
          menu: this.lengthSubMenu,
          text: 'header.preset-length',
          condition: () => {
            return this.sessionService.currentRole > 0;
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'description',
          class: 'material-icons-outlined',
          text: 'header.chat-self-description',
          callback: () =>
            GPTUserDescriptionDialogComponent.open(this.dialog, this.room.id),
          condition: () => {
            return this.sessionService.currentRole === 0;
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'format_align_justify',
          class: 'material-icons-outlined',
          menu: this.answerFormatSubMenu,
          text: 'header.chat-answer-format',
          condition: () => {
            return this.sessionService.currentRole === 0;
          },
        });
      },
    );
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

  private showContextPresetsDefinition() {
    const dialogRef = this.dialog.open(PresetsDialogComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.componentInstance.type = PresetsDialogType.CONTEXT;
    dialogRef.componentInstance.data = [this.preset.context];
    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          context: result[0],
        })
        .subscribe((preset) => {
          this.preset = preset;
        });
    });
  }
  private showTopicPresetsDefinition() {
    const dialogRef = this.dialog.open(PresetsDialogComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.componentInstance.type = PresetsDialogType.TOPIC;
    dialogRef.componentInstance.data = [
      this.preset.topics?.[0]?.description || '',
    ];
    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          topics: [{ description: result[0], active: true }],
        })
        .subscribe((preset) => {
          this.preset = preset;
        });
    });
  }
  private showPersonaPresetsDefinition() {
    const dialogRef = this.dialog.open(PresetsDialogComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.componentInstance.type = PresetsDialogType.PERSONA;
    dialogRef.componentInstance.data = [
      this.preset.personaModerator,
      this.preset.personaParticipant,
      this.preset.personaCreator,
    ];
    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          personaModerator: result[0],
          personaParticipant: result[1],
          personaCreator: result[2],
        })
        .subscribe((preset) => {
          this.preset = preset;
        });
    });
  }
}
