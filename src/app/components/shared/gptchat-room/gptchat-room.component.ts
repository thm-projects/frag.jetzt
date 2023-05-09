import { Location } from '@angular/common';
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
import {
  ChatCompletionMessage,
  ChatCompletionRequest,
  GptService,
  StreamChatCompletion,
} from 'app/services/http/gpt.service';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { LanguageService } from 'app/services/util/language.service';
import { SessionService } from 'app/services/util/session.service';
import { UserManagementService } from 'app/services/util/user-management.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import {
  ImmutableStandardDelta,
  MarkdownDelta,
  QuillUtils,
  StandardDelta,
} from 'app/utils/quill-utils';
import {
  finalize,
  Observable,
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
import { MatMenu } from '@angular/material/menu';
import {
  PresetsDialogComponent,
  PresetsDialogType,
} from '../_dialogs/presets-dialog/presets-dialog.component';
import { GPTRoomPreset } from 'app/models/gpt-room-preset';
import { GPTRoomPresetLength } from '../../../models/gpt-room-preset';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../models/user-roles.enum';
import { ForumComment } from '../../../utils/data-accessor';
import { EventService } from '../../../services/util/event.service';
import { map, take } from 'rxjs/operators';
import { clone } from '../../../utils/ts-utils';
import {
  CommentCreateOptions,
  KeywordExtractor,
} from '../../../utils/keyword-extractor';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from 'app/services/util/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { GPTPromptPreset } from 'app/models/gpt-prompt-preset';
import { escapeForRegex } from 'app/utils/regex-escape';
import { ComponentEvent, sendAwaitingEvent } from 'app/utils/component-events';
import { Comment } from 'app/models/comment';
import { GPTPresetTopicsDialogComponent } from '../_dialogs/gptpreset-topics-dialog/gptpreset-topics-dialog.component';
import { GptPromptExplanationComponent } from '../_dialogs/gpt-prompt-explanation/gpt-prompt-explanation.component';
import { GPTRatingDialogComponent } from '../_dialogs/gptrating-dialog/gptrating-dialog.component';

interface ConversationEntry {
  type: 'human' | 'gpt' | 'system';
  message: string;
}

interface ContextOption {
  key: string;
  text: string;
  hover?: string;
}

type SelectComponents = { text?: string; small?: string }[];

interface Context {
  name: string;
  type: 'single' | 'multiple' | 'quill';
  access?: { [key: string]: ContextOption };
  value?: ContextOption | ContextOption[] | ImmutableStandardDelta;
  parts?: Observable<MultiContextElement[]>;
  selected?: string;
  allowNone?: true;
}

interface MultiContextElement {
  text?: string;
  type: 'select' | 'span' | 'quill';
}

@Component({
  selector: 'app-gptchat-room',
  templateUrl: './gptchat-room.component.html',
  styleUrls: ['./gptchat-room.component.scss'],
})
export class GPTChatRoomComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(ViewCommentDataComponent)
  commentData: ViewCommentDataComponent;
  @ViewChild('lengthSubMenu') lengthSubMenu: MatMenu;
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
  stopper = new Subject<boolean>();
  isGPTPrivacyPolicyAccepted: boolean = false;
  initDelta: StandardDelta;
  GPTRoomPresetLength = GPTRoomPresetLength;
  prompts: GPTPromptPreset[] = [];
  amountOfFoundActs: number = 0;
  amountOfFoundPrompts: number = 0;
  filteredPrompts: GPTPromptPreset[] = [];
  temperature: number = 0.7;
  searchTerm: string = '';
  answeringComment = false;
  answeringWriteComment = false;
  temperatureOptions: { key: string; value: number; text: SelectComponents }[] =
    [
      {
        key: 'creative',
        value: 1.0,
        text: [],
      },
      {
        key: 'balanced',
        value: 0.7,
        text: [],
      },
      {
        key: 'precise',
        value: 0,
        text: [],
      },
    ];
  contexts: Context[] = [
    {
      name: 'context',
      type: 'single',
      value: null,
    },
    {
      name: 'topic',
      type: 'multiple',
      value: null,
    },
    {
      name: 'response-length',
      type: 'single',
      value: null,
    },
    {
      name: 'response-format',
      type: 'multiple',
      value: null,
      allowNone: true,
    },
    {
      name: 'question',
      type: 'quill',
      value: null,
    },
  ];
  protected selectedPrompt: GPTPromptPreset = null;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private _list: ComponentRef<any>[];
  private _preset: GPTRoomPreset;
  private keywordExtractor: KeywordExtractor;

  constructor(
    private gptService: GptService,
    private userManagementService: UserManagementService,
    private translateService: TranslateService,
    private languageService: LanguageService,
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
    private notificationService: NotificationService,
  ) {
    this.keywordExtractor = new KeywordExtractor(injector);
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this.destroyer))
      .subscribe(() => {
        this.updatePresetEntries(this._preset);
      });
  }

  ngOnInit(): void {
    this.eventService
      .on<ForumComment>('gptchat-room.data')
      .pipe(takeUntil(this.destroyer), take(1))
      .subscribe((comment) => {
        this.owningComment = comment;
      });
    this.eventService.broadcast('gptchat-room.init');
    if (this.owningComment?.body) {
      this.answeringComment = true;
      this.answeringWriteComment = true;
      this.initDelta = clone(this.owningComment?.body);
      this.getContextByName('question').value = clone(this.initDelta);
    } else {
      this.initDelta = { ops: [] };
      this.loadConversation();
    }
    if (this.answeringComment) {
      this.headerService.getHeaderComponent().customOptionText = {
        key: 'header.chatroom-options-menu',
      };
    }
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
    const prefix = 'gpt-chat.temperature-';
    this.translateService
      .stream(this.temperatureOptions.map((x) => prefix + x.key))
      .pipe(takeUntil(this.destroyer))
      .subscribe((msg) => {
        this.temperatureOptions.forEach((e) => {
          e.text = this.generateComponents(msg[prefix + e.key]);
        });
      });
  }

  setValue(prompt: GPTPromptPreset) {
    this.selectedPrompt = prompt;
    let msg = prompt.prompt;
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
    this.headerService.getHeaderComponent().customOptionText = null;
    this._list?.forEach((e) => e.destroy());
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  formatText(text: string) {
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
    let roleString = 'participant';
    switch (this.sessionService.currentRole) {
      case UserRole.PARTICIPANT:
        roleString = 'participant';
        break;
      case UserRole.CREATOR:
        roleString = 'creator';
        break;
      case UserRole.EXECUTIVE_MODERATOR:
        roleString = 'moderator';
    }
    this.route.params.subscribe((params) => {
      url = `${roleString}/room/${params['shortId']}/`;
      if (this.owningComment) {
        url += `comment/${this.owningComment.id}/conversation`;
      } else {
        url += `comments`;
      }
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
      commentReference: this.owningComment?.id || null,
      keywordExtractionActive:
        this.sessionService.currentRoom?.keywordExtractionActive,
    };
    this.keywordExtractor
      .createCommentInteractive(options)
      .pipe(
        switchMap((comment) => {
          comment.gptWriterState = 1;
          return this.commentService.addComment(comment);
        }),
      )
      .subscribe(() =>
        GPTRatingDialogComponent.open(this.dialog, this.gptService).subscribe({
          next: (ref) => {
            if (!ref) {
              this.router.navigate([url]);
            } else {
              ref.afterClosed().subscribe(() => this.router.navigate([url]));
            }
          },
        }),
      );
  }

  copyMarkdown(index: number) {
    const text = this.conversation[index].message;
    navigator.clipboard.writeText(text).then(
      () => {
        this.translateService
          .get('gpt-chat.copy-success')
          .subscribe((msg) => this.notificationService.show(msg));
      },
      (err) => {
        console.error(err);
        this.translateService
          .get('gpt-chat.copy-fail')
          .subscribe((msg) => this.notificationService.show(msg));
      },
    );
  }

  openEditGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    const text = this.conversation[index].message;
    const data = QuillUtils.getDeltaFromMarkdown(text as MarkdownDelta);
    sendAwaitingEvent(
      this.eventService,
      new ComponentEvent(
        'comment-answer.on-startup',
        'comment-answer.receive-startup',
        { body: data, gptWriterState: 3, approved: true } as Partial<Comment>,
      ),
    ).subscribe();
    let url: string;
    let roleString = 'participant';
    switch (this.sessionService.currentRole) {
      case UserRole.PARTICIPANT:
        roleString = 'participant';
        break;
      case UserRole.CREATOR:
        roleString = 'creator';
        break;
      case UserRole.EXECUTIVE_MODERATOR:
        roleString = 'moderator';
    }
    this.route.params.subscribe((params) => {
      url = `${roleString}/room/${params['shortId']}/comment/${this.owningComment.id}`;
      this.router.navigate([url]);
    });
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
      .requestChatStream({
        messages: this.generatePrompt(index),
        roomId: this.room?.id || null,
        model: 'gpt-3.5-turbo',
        temperature: this.temperature,
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

  cancel() {
    this.location.back();
  }

  canSend() {
    if (!this.answeringComment || this.conversation.length > 0) {
      return true;
    }
    return this.contexts.every(
      (e) => !e.value || e.type !== 'multiple' || e.selected || e.allowNone,
    );
  }

  sendGPTMessage() {
    if (this.isSending || this.error) {
      return;
    }
    this.isSending = true;
    this.renewIndex = -1;
    const lastType =
      this.conversation[this.conversation.length - 1]?.type || 'system';
    const currentText = this.getCurrentText();
    if (this.answeringComment && this.conversation.length < 1) {
      this.conversation.push({
        type: 'system',
        message:
          this._preset.roleInstruction ||
          'You are a multilingual chat assistant on a Q&A forum answering questions. Always answer in a professional manner. If you do not know the answer to a question, do not make it up. Instead, ask a follow-up question to get more context.',
      });
    }
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
    this.renewIndex = index;
    this.conversation.push({
      message: '',
      type: 'gpt',
    });
    const request: ChatCompletionRequest = {
      messages: this.generatePrompt(index),
      roomId: this.room?.id || null,
      model: 'gpt-3.5-turbo',
      temperature: this.temperature,
    };
    if (this.selectedPrompt !== null) {
      request.temperature = this.selectedPrompt.temperature;
      request.presencePenalty = this.selectedPrompt.presencePenalty;
      request.frequencyPenalty = this.selectedPrompt.frequencyPenalty;
      request.topP = this.selectedPrompt.topP;
    }
    this.gptService
      .requestChatStream(request)
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

  generateComponents(msg: string): SelectComponents {
    const regex = /\[[^\]]*\]/gm;
    const res: SelectComponents = [];
    let m: RegExpExecArray;
    let index = 0;
    while ((m = regex.exec(msg)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      if (index < m.index) {
        res.push({ text: msg.slice(index, m.index) });
      }
      index = m.index + m[0].length;
      res.push({ small: msg.slice(m.index + 1, index - 1) });
    }
    if (index < msg.length) {
      res.push({ text: msg.slice(index) });
    }
    return res;
  }

  getError() {
    return typeof this.error === 'string'
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

  showPromptExplanation() {
    this.dialog.open(GptPromptExplanationComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
  }

  showError(message: string) {
    this.notificationService.show(message, undefined, {
      duration: 12_500,
      panelClass: ['snackbar', 'important'],
    });
  }

  protected forwardAllowed() {
    return !this._preset?.disableForwardMessage;
  }

  protected splitIntoParts(
    context: Context,
  ): Observable<MultiContextElement[]> {
    if (context.parts) {
      return context.parts;
    }
    context.parts = this.translateService
      .stream('gpt-chat.context-' + context.name)
      .pipe(
        takeUntil(this.destroyer),
        map((message) => {
          const parts = message.split('{{value}}');
          const result: MultiContextElement[] = [];
          for (let i = 0; i < parts.length - 1; i++) {
            result.push({ text: parts[i], type: 'span' });
            result.push({
              type: context.type === 'multiple' ? 'select' : 'quill',
            });
          }
          result.push({ text: parts[parts.length - 1], type: 'span' });
          return result;
        }),
      );
    return context.parts;
  }

  protected setLengthPreset(length: GPTRoomPresetLength): void {
    this.gptService
      .patchPreset(this.room.id, { length })
      .subscribe((newPreset) => this.updatePresetEntries(newPreset));
  }

  protected filterPrompts() {
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

  private initNormal() {
    this.sessionService.getRoomOnce().subscribe((r) => {
      this.room = r;
      this.gptService.getPreset(this.room.id).subscribe((preset) => {
        this.updatePresetEntries(preset);
      });
      this.gptService.getPrompts().subscribe((prompts) => {
        this.prompts = prompts;
      });
    });
    this.sessionService.getGPTStatusOnce().subscribe({
      next: (data) => {
        if (data.restricted) {
          this.error = 'Restricted';
          this.translateService
            .get('gpt-chat.input-forbidden')
            .subscribe((msg) => {
              this.error = msg;
              this.showError(msg);
            });
        } else if (
          !(
            data.apiKeyPresent ||
            (data.usingTrial && data.globalInfo.apiKeyPresent)
          )
        ) {
          this.error = 'No API Key';
          this.translateService
            .get('gpt-chat.no-api-setup')
            .subscribe((msg) => {
              this.error = msg;
              this.showError(msg);
            });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = err;
        this.showError(this.getError());
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
          icon: 'question_mark',
          class: 'material-icons-outlined',
          text: 'header.prompt-explanation',
          callback: () => this.showPromptExplanation(),
          condition: () => {
            return (
              this.sessionService.currentRole > 0 && this.answeringWriteComment
            );
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'integration_instructions',
          class: 'material-icons-outlined',
          text: 'header.preset-role-instruction',
          callback: () => this.showInstructionPresetsDefinition(),
          condition: () => {
            return this.sessionService.currentRole > 0 && this.answeringComment;
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'architecture',
          class: 'material-icons-outlined',
          text: 'header.preset-context',
          callback: () => this.showContextPresetsDefinition(),
          condition: () => {
            return (
              this.sessionService.currentRole > 0 && this.answeringWriteComment
            );
          },
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'topic',
          class: 'material-icons-outlined',
          text: 'header.preset-topic',
          callback: () => this.showTopicPresetsDefinition(),
          condition: () => {
            return (
              this.sessionService.currentRole > 0 && this.answeringWriteComment
            );
          },
        });
        e.subMenu({
          translate: this.headerService.getTranslate(),
          icon: 'straighten',
          class: 'material-icons-outlined',
          menu: this.lengthSubMenu,
          text: 'header.preset-length',
          condition: () => {
            return (
              this.sessionService.currentRole > 0 && this.answeringWriteComment
            );
          },
          menuOpened: () => {
            const active = this._preset.length;
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
          icon: 'feedback',
          class: 'material-icons-outlined',
          text: 'header.gpt-feedback',
          callback: () =>
            GPTRatingDialogComponent.open(
              this.dialog,
              this.gptService,
              true,
            ).subscribe(),
          condition: () => true,
        });
      },
    );
  }

  private generatePrompt(
    length: number = this.conversation.length,
  ): ChatCompletionMessage[] {
    const roles: {
      [key in ConversationEntry['type']]: ChatCompletionMessage['role'];
    } = {
      gpt: 'assistant',
      human: 'user',
      system: 'system',
    };
    return this.conversation.slice(0, length).reduce((acc, current, i) => {
      if (current.message.trim().length < 1) {
        if ((this.conversation[i + 1]?.message?.trim()?.length || 1) < 1) {
          return;
        }
      }
      acc.push({
        role: roles[current.type],
        content: current.message,
      });
      return acc;
    }, [] as ChatCompletionMessage[]);
  }

  private getContextByName(name: string) {
    return this.contexts.find((e) => e.name === name);
  }

  private generateObserver(
    index: number,
  ): Partial<Observer<StreamChatCompletion>> {
    return {
      next: (msg) => {
        const currentText = this.getCurrentText();
        if ('choices' in msg) {
          const firstChoice = msg.choices.find((choice) => choice.index === 0);
          if (!firstChoice) {
            return;
          }
          this.conversation[index] = {
            message:
              this.conversation[index].message +
              (firstChoice.delta.content || ''),
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
        this.showError(errorMessage);
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
      JSON.stringify(this.conversation),
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

  private getCurrentText(): string {
    if (this.answeringWriteComment && this.conversation.length < 1) {
      return this.contexts.reduce((acc, current) => {
        if (!current.value) {
          return acc;
        }
        let message: string;
        this.translateService
          .get('gpt-chat.context-' + current.name)
          .subscribe((msg) => (message = msg));
        if (current.type === 'single') {
          message = message.replaceAll('{{value}}', current.value['text']);
        } else if (current.type === 'quill') {
          message = message.replaceAll(
            '{{value}}',
            QuillUtils.getMarkdownFromDelta(
              current.value as ImmutableStandardDelta,
            ),
          );
        } else {
          if (!current.selected) {
            return acc;
          }
          message = message.replaceAll(
            '{{value}}',
            (current.value as ContextOption[]).find(
              (e) => e.key === current.selected,
            ).text,
          );
        }
        return (acc ? acc + '\n' : '') + message;
      }, '');
    }
    const data = this.commentData?.currentData;
    if (!data) {
      return '';
    }
    return QuillUtils.getMarkdownFromDelta(data);
  }

  private updatePresetEntries(preset: GPTRoomPreset) {
    this._preset = preset;
    if (!preset) {
      return;
    }
    this.getContextByName('context').value = preset.context
      ? { key: null, text: preset.context }
      : null;
    let arr: string[] = [];
    if (preset.topics) {
      arr = preset.topics.filter((e) => e.active).map((e) => e.description);
      preset.topics.sort((a, b) =>
        a.description.localeCompare(b.description, undefined, {
          sensitivity: 'base',
        }),
      );
    }
    this.getContextByName('topic').value = arr?.length
      ? arr.map((e, i) => ({ key: String(i), text: e }))
      : null;
    if (preset.length) {
      this.translateService
        .get('gpt-chat.choices.response-length.' + preset.length)
        .subscribe((msg) => {
          this.getContextByName('response-length').value = {
            key: preset.length,
            text: msg,
          };
        });
    } else {
      this.getContextByName('response-length').value = null;
    }
    this.translateService
      .get('gpt-chat.choices.response-format')
      .subscribe((options) => {
        const obj = this.getContextByName('response-format');
        obj.value = options;
        obj.access = {};
        options.forEach((e) => (obj.access[e.key] = e));
      });
    this.answeringWriteComment =
      this.answeringComment && !preset.disableEnhancedPrompt;
    if (
      this.conversation.length < 1 &&
      !this.answeringWriteComment &&
      this.answeringComment
    ) {
      this.sendGPTMessage();
    }
  }

  private showContextPresetsDefinition() {
    const dialogRef = this.dialog.open(PresetsDialogComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.componentInstance.type = PresetsDialogType.CONTEXT;
    dialogRef.componentInstance.data = [this._preset.context];
    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          context: result[0],
        })
        .subscribe((preset) => {
          this.updatePresetEntries(preset);
        });
    });
  }

  private showInstructionPresetsDefinition() {
    const dialogRef = this.dialog.open(PresetsDialogComponent, {
      autoFocus: false,
      width: '80%',
      maxWidth: '600px',
    });
    dialogRef.componentInstance.type = PresetsDialogType.ROLE_INSTRUCTION;
    dialogRef.componentInstance.data = [this._preset.roleInstruction || ''];
    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          roleInstruction: result[0] || null,
        })
        .subscribe((preset) => {
          this.updatePresetEntries(preset);
        });
    });
  }

  private showTopicPresetsDefinition() {
    const dialogRef = GPTPresetTopicsDialogComponent.open(
      this.dialog,
      this._preset.topics,
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.gptService
        .patchPreset(this.room.id, {
          topics: result,
        })
        .subscribe((preset) => {
          this.updatePresetEntries(preset);
        });
    });
  }
}
