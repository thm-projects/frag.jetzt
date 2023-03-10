import { Location } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ComponentRef,
  Injector,
  Input,
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
import { LanguageService } from 'app/services/util/language.service';
import { SessionService } from 'app/services/util/session.service';
import { UserManagementService } from 'app/services/util/user-management.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import {
  MarkdownDelta,
  QuillUtils,
  StandardDelta,
} from 'app/utils/quill-utils';
import {
  finalize,
  Observer,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
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
import {
  GPTRoomAnswerFormat,
  GPTRoomPreset,
  GPTRoomPresetTone,
} from 'app/models/gpt-room-preset';
import {
  GPTRoomPresetLanguage,
  GPTRoomPresetLength,
} from '../../../models/gpt-room-preset';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { ForumComment } from '../../../utils/data-accessor';
import { EventService } from '../../../services/util/event.service';
import { take } from 'rxjs/operators';
import { clone } from '../../../utils/ts-utils';
import {
  CommentCreateOptions,
  KeywordExtractor,
} from '../../../utils/keyword-extractor';
import { CommentService } from '../../../services/http/comment.service';

interface ConversationEntry {
  type: 'human' | 'gpt' | 'error';
  message: string;
}

interface PromptType {
  act: string;
  prompt: string;
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
  @Input() private owningComment: ForumComment;
  conversation: ConversationEntry[] = [];
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
  answerFormat: GPTRoomAnswerFormat = GPTRoomAnswerFormat.DISABLED;
  GPTRoomPresetLanguage = GPTRoomPresetLanguage;
  GPTRoomPresetLength = GPTRoomPresetLength;
  GPTRoomPresetTone = GPTRoomPresetTone;
  GPTRoomAnswerFormat = GPTRoomAnswerFormat;
  prompts: PromptType[] = [];
  filteredPrompts: PromptType[];
  searchTerm: string = '';
  roleString: string;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private _list: ComponentRef<any>[];
  private preset: GPTRoomPreset;
  private keywordExtractor: KeywordExtractor;

  constructor(
    private gptService: GptService,
    private userManagementService: UserManagementService,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private http: HttpClient,
    private deviceInfo: DeviceInfoService,
    private gptEncoderService: GptEncoderService,
    public sessionService: SessionService,
    public dialog: MatDialog,
    private location: Location,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private route: ActivatedRoute,
    private eventService: EventService,
    protected router: Router,
    private injector: Injector,
    private commentService: CommentService,
  ) {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.http
          .get<PromptType[]>('/assets/i18n/prompts/' + lang + '.json')
          .subscribe((promptsArray) => {
            this.prompts = promptsArray;
          });
      });
    this.keywordExtractor = new KeywordExtractor(injector);
  }

  ngOnInit(): void {
    this.eventService
      .on<ForumComment>('gptchat-room.data')
      .pipe(takeUntil(this.destroyer), take(1))
      .subscribe((comment) => {
        this.owningComment = comment;
      });
    this.eventService.broadcast('gptchat-room.init');
    this.initDelta = clone(this.owningComment?.body) || { ops: [] };
    this.loadConversation();
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
    this.sessionService
      .getRole()
      .pipe(takeUntil(this.destroyer), take(1))
      .subscribe((role) => {
        switch (role) {
          case UserRole.PARTICIPANT:
            this.roleString = 'participant';
            break;
          case UserRole.CREATOR:
            this.roleString = 'creator';
            break;
          case UserRole.EXECUTIVE_MODERATOR:
            this.roleString = 'moderator';
        }
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

  forwardGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    const text = this.conversation[index].message;
    const data = QuillUtils.getDeltaFromMarkdown(text as MarkdownDelta);

    let url: string;
    this.route.params.subscribe((params) => {
      url = `${this.roleString}/room/${params['shortId']}/comment/${this.owningComment.id}/conversation`;
    });
    const options: CommentCreateOptions = {
      userId: this.userManagementService.getCurrentUser().id,
      brainstormingSessionId: null,
      brainstormingLanguage: 'en',
      body: data,
      tag: null,
      questionerName: 'Chatbot',
      isModerator: this.sessionService.currentRole > 0,
      hadUsedDeepL: false,
      selectedLanguage: 'auto',
      commentReference: this.owningComment.id,
    };
    this.keywordExtractor
      .createCommentInteractive(options)
      .pipe(switchMap((comment) => this.commentService.addComment(comment)))
      .subscribe(() => this.router.navigate([url]));
  }

  openEditGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    const text = this.conversation[index].message;
    const data = QuillUtils.getDeltaFromMarkdown(text as MarkdownDelta);
    console.log(data);
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

  filterPrompts() {
    this.filteredPrompts = this.prompts.filter((prompt) => {
      return (
        prompt.act.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
      );
    });
    if (!this.searchTerm.trim()) {
      return;
    }
    this.filteredPrompts.push({ act: '------', prompt: null });
    this.filteredPrompts.push(
      ...this.prompts.filter((prompt) => {
        return (
          prompt.prompt.toLowerCase().indexOf(this.searchTerm.toLowerCase()) >
          -1
        );
      }),
    );
  }

  protected setLanguagePreset(language: GPTRoomPresetLanguage): void {
    this.gptService
      .patchPreset(this.room.id, { language })
      .subscribe((newPreset) => (this.preset = newPreset));
  }

  protected setTonePreset(tone: GPTRoomPresetTone): void {
    this.gptService
      .patchPreset(this.room.id, {
        tones: [{ description: tone, active: true }],
      })
      .subscribe((newPreset) => (this.preset = newPreset));
  }

  protected setFormalityPreset(formality?: boolean): void {
    this.gptService
      .patchPreset(this.room.id, { formal: formality })
      .subscribe((newPreset) => (this.preset = newPreset));
  }

  protected setLengthPreset(length: GPTRoomPresetLength): void {
    this.gptService
      .patchPreset(this.room.id, { length })
      .subscribe((newPreset) => (this.preset = newPreset));
  }

  protected setAnswerFormat(answerFormat: GPTRoomAnswerFormat): void {
    this.answerFormat = answerFormat;
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
          menuOpened: () => {
            const active = this.preset.language;
            const languages = Object.values(GPTRoomPresetLanguage);
            const index = languages.findIndex(
              (language) => language === active,
            );
            if (index < 0) {
              return;
            }
            this.languageSubMenu._allItems.get(index).focus();
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
          menuOpened: () => {
            const active = this.preset.tones[0].description;
            const tones = Object.values(GPTRoomPresetTone);
            const index = tones.findIndex((tone) => tone === active);
            if (index < 0) {
              return;
            }
            this.toneSubMenu._allItems.get(index).focus();
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
          menuOpened: () => {
            const active = this.preset.formal;
            const index = active === null ? 0 : active ? 2 : 1;
            if (index < 0) {
              return;
            }
            this.formalitySubMenu._allItems.get(index).focus();
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
          menuOpened: () => {
            const active = this.preset.length;
            const lengths = Object.values(GPTRoomPresetLength);
            const index = lengths.findIndex((length) => length === active);
            if (index < 0) {
              return;
            }
            this.lengthSubMenu._allItems.get(index).focus();
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
          menuOpened: () => {
            const active = this.answerFormat;
            const answerFormats = Object.values(GPTRoomAnswerFormat);
            const index = answerFormats.findIndex(
              (answerFormat) => answerFormat === active,
            );
            if (index < 0) {
              return;
            }
            this.answerFormatSubMenu._allItems.get(index).focus();
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
