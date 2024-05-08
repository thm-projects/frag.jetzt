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
import { TranslateService } from '@ngx-translate/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { Room } from 'app/models/room';
import {
  ChatCompletionMessage,
  ChatCompletionModels,
  ChatCompletionRequest,
  GptService,
  StreamChatCompletion,
} from 'app/services/http/gpt.service';
import { GptEncoderService } from 'app/services/util/gpt-encoder.service';
import { SessionService } from 'app/services/util/session.service';
import {
  finalize,
  Observable,
  Observer,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { GptOptInPrivacyComponent } from '../_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { IntroductionPromptGuideChatbotComponent } from '../_dialogs/introductions/introduction-prompt-guide-chatbot/introduction-prompt-guide-chatbot.component';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
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
import { filter, map, take, tap } from 'rxjs/operators';
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
import {
  GPTConversation,
  GPTConversationEntry,
  GPTConversationService,
} from 'app/services/http/gptconversation.service';
import { GPTConversationOverviewComponent } from '../_dialogs/gptconversation-overview/gptconversation-overview.component';
import { AppStateService } from 'app/services/state/app-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatMenu } from '@angular/material/menu';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { applyRoomNavigation } from '../../../navigation/room-navigation';

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

interface ContextBase {
  name: string;
  access?: { [key: string]: ContextOption };
  parts?: Observable<MultiContextElement[]>;
  selected?: string;
  allowNone?: true;
}

interface ContextSingle extends ContextBase {
  type: 'single';
  value?: ContextOption;
}

interface ContextMultiple extends ContextBase {
  type: 'multiple';
  value?: ContextOption[];
}

interface ContextQuill extends ContextBase {
  type: 'quill';
  value?: string;
}

type Context = ContextSingle | ContextMultiple | ContextQuill;

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
  @ViewChild('lengthSubMenu') lengthSubMenu: MatMenu;
  @ViewChild('sendButton', { static: false })
  sendButton: MatButton;
  @Input() protected owningComment: ForumComment;
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
  initDelta: string;
  GPTRoomPresetLength = GPTRoomPresetLength;
  prompts: GPTPromptPreset[] = [];
  amountOfFoundActs: number = 0;
  amountOfFoundPrompts: number = 0;
  filteredPrompts: GPTPromptPreset[] = [];
  temperature: number = 0.7;
  searchTerm: string = '';
  answeringComment = false;
  answeringWriteComment = false;
  model: ChatCompletionRequest['model'] = 'gpt-3.5-turbo';
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
  chatModels: (typeof ChatCompletionModels)[number][] = [
    'gpt-3.5-turbo',
    'gpt-4-turbo',
  ];
  prettifyModel = this.translateModel.bind(this);
  enterEvent = this.onEnter.bind(this);
  systemMessagesVisible = false;
  editIndex = -1;
  autoSave = false;
  protected selectedPrompt: GPTPromptPreset = null;
  private activeConversation: GPTConversation;
  private destroyer = new ReplaySubject(1);
  private encoder: GPTEncoder = null;
  private room: Room = null;
  private _list: ComponentRef<unknown>[];
  private _preset: GPTRoomPreset;
  private keywordExtractor: KeywordExtractor;
  private language: string;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
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
    private gptConversation: GPTConversationService,
    private accountState: AccountStateService,
    private deviceState: DeviceStateService,
    protected roomState: RoomStateService,
    appState: AppStateService,
  ) {
    this.initNav();
    this.keywordExtractor = new KeywordExtractor(injector);
    appState.language$.pipe(takeUntil(this.destroyer)).subscribe((lang) => {
      this.language = lang;
      this.updatePresetEntries(this._preset);
      this.filterPrompts();
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
      this.initDelta = this.owningComment?.body;
      this.getContextByName('question').value = this.initDelta;
    } else {
      this.initDelta = '';
    }
    if (
      this.answeringComment &&
      ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] >
        UserRole.PARTICIPANT
    ) {
      this.headerService.getHeaderComponent().customOptionText = {
        key: 'header.chatroom-options-menu',
      };
    }
    this.initNormal();
    this.gptEncoderService.getEncoderOnce().subscribe((e) => {
      this.encoder = e;
      this.calculateTokens(this.getCurrentText());
    });
    this.accountState.gptConsented$
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
    this.initDelta = msg;
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
      this.accountState.updateGPTConsentState(result);
      if (!result) {
        this.location.back();
      }
    });
  }

  ngOnDestroy(): void {
    this.quitConversation();
    this.headerService.getHeaderComponent().customOptionText = null;
    this._list?.forEach((e) => e.destroy());
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  formatText(entry: ConversationEntry) {
    let text = entry.message;
    if (!this.systemMessagesVisible && entry.type === 'system') {
      let index = text.indexOf('.');
      index = index < 0 ? text.length : index + 1 > 150 ? 150 : index + 1;
      text = text.substring(0, index) + (index < text.length ? ' …' : '');
    }
    return text.replace(/\n/g, '<br>');
  }

  onEnter(modifier: boolean) {
    if (modifier === this.deviceState.isMobile()) {
      setTimeout(() => this.sendGPTMessage());
    }
  }

  clearMessages() {
    this.conversation = [];
    this.deleteMessages(0).subscribe();
    this.calculateTokens(this.getCurrentText());
  }

  forwardGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    const text = this.conversation[index].message;
    let url: string;
    const roleString =
      this.roomState.getCurrentAssignedRole()?.toLowerCase?.() || 'participant';
    this.route.params.subscribe((params) => {
      url = `${roleString}/room/${params['shortId']}/`;
      if (this.owningComment) {
        url += `comment/${this.owningComment.id}/conversation`;
      } else {
        url += `comments`;
      }
    });
    const options: CommentCreateOptions = {
      userId: this.accountState.getCurrentUser().id,
      brainstormingSessionId: null,
      brainstormingLanguage: 'en',
      body: text,
      tag: null,
      questionerName: 'Chatbot',
      isModerator:
        ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0,
      hadUsedDeepL: false,
      selectedLanguage: 'auto',
      commentReference: this.owningComment?.id || null,
      keywordExtractionActive:
        this.sessionService.currentRoom?.keywordExtractionActive,
      ignoreKeywordFailure: true,
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
        GPTRatingDialogComponent.open(
          this.dialog,
          this.gptService,
          true,
        ).subscribe({
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

  editMessage(index: number) {
    const text = this.conversation[index].message;
    this.initDelta = text;
    this.editIndex = index;
    this.sendButton._elementRef.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'center',
    });
  }

  abortEdit() {
    this.editIndex = -1;
  }

  openEditGPTMessage(index: number) {
    if (this.isSending) {
      return;
    }
    const text = this.conversation[index].message;
    sendAwaitingEvent(
      this.eventService,
      new ComponentEvent(
        'comment-answer.on-startup',
        'comment-answer.receive-startup',
        { body: text, gptWriterState: 3, approved: true } as Partial<Comment>,
      ),
    ).subscribe();
    let url: string;
    const roleString =
      this.roomState.getCurrentAssignedRole()?.toLowerCase?.() || 'participant';
    this.route.params.subscribe((params) => {
      url = `${roleString}/room/${params['shortId']}/comment/${this.owningComment.id}`;
      GPTRatingDialogComponent.open(
        this.dialog,
        this.gptService,
        true,
      ).subscribe({
        next: (ref) => {
          if (!ref) {
            this.router.navigate([url]);
          } else {
            ref.afterClosed().subscribe(() => this.router.navigate([url]));
          }
        },
      });
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
        model: this.model,
        temperature: this.temperature,
      })
      .pipe(
        takeUntil(this.stopper),
        finalize(() => {
          this.isSending = false;
          this.renewIndex = -1;
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
    const currentText = this.getCurrentText();
    if (this.answeringComment && this.conversation.length < 1) {
      this.conversation.push({
        type: 'system',
        message:
          this._preset.roleInstruction ||
          "As a multilingual AI on a Q&A platform catered to students, provide precise, courteous, and prompt replies in the user's language, understanding cultural nuances, academic terminology, and using gender-inclusive language. Adjust numerical data, including presenting numbers with the language-specific thousands separators, dates, and units. Ensure clear, detailed responses, offering deeper insights where necessary without speculations or extraneous details. Navigate controversial topics with respect and neutrality, and facilitate productive discussions. Be prepared to handle complex topics, provide detailed answers, and cite credible, verifiable sources for information provided. Seek clarifications actively, adjust to diverse communication styles, and make students feel valued, understood, and empowered with timely, accurate information.",
      });
      this.addMessage(this.conversation.length - 1).subscribe();
    }
    if (this.editIndex >= 0) {
      this.conversation[this.editIndex] = {
        ...this.conversation[this.editIndex],
        message: currentText,
      };
      const index = this.editIndex;
      this.conversation.splice(index + 1);
      this.deleteMessages(index).subscribe(() => {
        this.addMessage(index).subscribe();
      });
      this.editIndex = -1;
    } else {
      this.conversation.push({
        message: currentText,
        type: 'human',
      });
      this.addMessage(this.conversation.length - 1).subscribe();
    }
    this.initDelta = '';
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
      model: this.model,
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

  openOverview() {
    const ref = GPTConversationOverviewComponent.open(
      this.dialog,
      this.sessionService.currentRoom.id,
      this.activeConversation?.id,
    );
    ref.afterClosed().subscribe((data) => {
      if (!data) {
        return;
      }
      this.quitConversation();
      this.selectedPrompt = null;
      this.activeConversation = data;
      this.model = this.activeConversation
        .model as ChatCompletionRequest['model'];
      this.conversation = this.activeConversation.messages.map((e) => {
        const role =
          e.role === 'user'
            ? 'human'
            : e.role === 'assistant'
              ? 'gpt'
              : 'system';
        return {
          type: role,
          message: e.content,
        };
      });
      this.autoSave = true;
    });
  }

  saveConversation() {
    let obj = this.activeConversation;
    if (!obj) {
      obj = new GPTConversation({} as GPTConversation);
    }
    obj.accountId = this.accountState.getCurrentUser().id;
    obj.roomId = this.sessionService.currentRoom.id;
    obj.model = this.model;
    obj.messages = this.conversation.map(
      (e, i) =>
        new GPTConversationEntry({
          conversationId: obj.id || null,
          content: e.message,
          role:
            e.type === 'gpt'
              ? 'assistant'
              : e.type === 'human'
                ? 'user'
                : 'system',
          createdAt: new Date(),
          index: i,
        }),
    );
    return this.gptConversation.update(obj).subscribe((conversation) => {
      this.autoSave = true;
      this.activeConversation = conversation;
    });
  }

  protected getAsQuill(context: Context) {
    return context.value as string;
  }

  protected getAsSelectArray(context: Context) {
    return context.value as ContextOption[];
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
    const prompts = this.prompts.filter((x) => x.language === this.language);
    if (!this.searchTerm.trim()) {
      this.filteredPrompts = prompts;
      return;
    }
    this.filteredPrompts.length = 0;
    const searchRegex = new RegExp(
      '\\b' + escapeForRegex(this.searchTerm),
      'gi',
    );
    this.filteredPrompts.push({ act: 'acts', prompt: null } as GPTPromptPreset);
    const data = prompts
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
    const promptData = prompts
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

  protected calculateTokens(text: string) {
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

  protected getCurrentText(): string {
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
          message = message.replaceAll('{{value}}', current.value);
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
    return '';
    // TODO:
    // return QuillUtils.getMarkdownFromDelta(data);
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
          icon: 'theater_comedy',
          class: 'material-icons-filled',
          text: 'header.preset-role-instruction',
          callback: () => this.showInstructionPresetsDefinition(),
          condition: () => {
            return (
              ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0 &&
              this.answeringComment
            );
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
              ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0 &&
              this.answeringWriteComment
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
              ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0 &&
              this.answeringWriteComment
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
              ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0 &&
              this.answeringWriteComment
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
          icon: 'question_mark',
          class: 'material-icons-outlined',
          text: 'header.prompt-explanation',
          callback: () => this.showPromptExplanation(),
          condition: () => {
            return (
              ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] > 0 &&
              this.answeringWriteComment
            );
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

  private translateModel(e: string) {
    if (!e) {
      return e;
    }
    let str = e;
    this.translateService
      .get('gpt-chat.model-' + e)
      .subscribe((msg) => (str = msg));
    return str;
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
          return null;
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
          this.isSending = false;
          this.addMessage(index).subscribe();
        }
      },
      error: (e) => {
        this.addMessage(index).subscribe();
        const errorIndex = index + 1;
        const error = this.conversation[errorIndex];
        console.error('Error at index ' + errorIndex + ': ' + error.message);
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

  private deleteMessages(index: number) {
    if (!this.activeConversation || !this.autoSave) {
      return of();
    }
    return this.gptConversation
      .deleteMessages(this.activeConversation.id, index)
      .pipe(tap(() => this.activeConversation.messages.splice(index)));
  }

  private addMessage(index: number) {
    if (!this.activeConversation || !this.autoSave) {
      return of();
    }
    const top = this.conversation[index];
    const role =
      top.type === 'gpt'
        ? 'assistant'
        : top.type === 'human'
          ? 'user'
          : 'system';
    return this.gptConversation
      .addMessage({
        conversationId: this.activeConversation.id,
        role,
        content: top.message,
        createdAt: new Date(),
      })
      .pipe(tap((msg) => this.activeConversation.messages.push(msg)));
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
      this.accountState.gptConsented$
        .pipe(
          takeUntil(this.destroyer),
          filter((v) => v),
          take(1),
        )
        .subscribe(() => this.sendGPTMessage());
    }
  }

  private quitConversation() {
    if (!this.activeConversation || !this.autoSave) {
      return;
    }
    this.gptConversation
      .patch(this.activeConversation.id, {
        model: this.model,
      })
      .subscribe();
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

  private initNav() {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }
}
