import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  DestroyRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ResourceStatus,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Observable, ReplaySubject, of, takeUntil } from 'rxjs';
import { EventService } from '../../services/util/event.service';
import { first, take } from 'rxjs/operators';
import { AccountStateService } from 'app/services/state/account-state.service';
import { MatDialog } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { GptOptInPrivacyComponent } from 'app/components/shared/_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { Location } from '@angular/common';
import {
  Content,
  Message,
  UploadedFile,
} from 'app/services/http/assistants.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { ServerSentEvent } from 'app/utils/sse-client';
import { AiErrorComponent } from './ai-error/ai-error.component';
import { applyAiNavigation } from './navigation/ai-navigation';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AssistantThreadService,
  BaseMessage,
  InputMessage,
  Thread,
} from '../assistant-route/services/assistant-thread.service';
import { AssistantsManageComponent } from '../assistant-route/assistants-manage/assistants-manage.component';
import { AssistantManageService } from '../assistant-route/services/assistant-manage.service';
import { UUID } from 'app/utils/ts-utils';
import {
  assistants,
  selectAssistant,
  selectedAssistant,
  sortedAssistants,
} from '../assistant-route/state/assistant';
import { room } from '../state/room';
import { loadMessages, threads } from '../assistant-route/state/thread';
import { UIComment } from '../state/comment-updates';

interface ThreadEntry {
  ref: Thread;
  headLine: string;
  content: string;
  fetched: boolean;
  messages: Message[];
}

const transformMessage = (m: BaseMessage): Message => {
  const v = m.content;
  const content: Content[] =
    typeof v === 'string'
      ? [
          {
            type: 'text',
            text: { value: v, annotations: [] },
          },
        ]
      : (v as unknown as Content[]);
  const ids = (m.additional_kwargs?.attachments || []) as UUID[];
  return {
    role: m['type'] === 'human' ? 'user' : 'assistant',
    content,
    attachments: ids.map((id) => ({ file_id: id, tools: [] })),
  } satisfies Message;
};

@Component({
  selector: 'app-gptchat-room',
  templateUrl: './gptchat-room.component.html',
  styleUrls: ['./gptchat-room.component.scss'],
  standalone: false,
})
export class GPTChatRoomComponent implements OnInit, OnDestroy {
  @Input() protected owningComment: UIComment;
  protected readonly sortedAssistRefs = sortedAssistants;
  protected readonly selectedAssistant = selectedAssistant;
  protected readonly selectAssistant = selectAssistant;
  protected currentMessages = signal<Message[]>([]);
  protected selectedThread = signal<ThreadEntry | null>(null);
  protected threads = computed(() => {
    return (
      threads.value()?.map((e) => {
        const messages = e.messages();
        return {
          ref: e.thread,
          headLine: e.thread.name,
          content: '',
          fetched: Boolean(messages),
          messages: messages?.map(transformMessage) || [],
        } as ThreadEntry;
      }) || []
    );
  });
  protected state = signal<'loading' | 'ready' | 'sending'>('loading');
  protected error = signal<string | null>(null);
  protected overrideMessage = computed(() => {
    const error = this.error();
    if (error) {
      return error;
    }
    if (this.state() === 'ready' && !assistants.value()?.length) {
      return i18n().noAssistants;
    }
    return '';
  });
  protected isMobile = signal(false);
  protected isOpen = signal(false);
  protected readonly i18n = i18n;
  protected isPrivileged = signal<boolean>(false);
  protected onSend = this.sendMessage.bind(this);
  private destroyer = new ReplaySubject<void>(1);
  private injector = inject(Injector);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private eventService = inject(EventService);
  private accountState = inject(AccountStateService);
  private assistantThread = inject(AssistantThreadService);
  private assistantManage = inject(AssistantManageService);
  private roomState = inject(RoomStateService);
  private destroyRef = inject(DestroyRef);
  private seen = new Set<UUID>();

  constructor(deviceState: DeviceStateService) {
    this.initNav();
    const sub = this.roomState.assignedRole$.subscribe((e) =>
      this.isPrivileged.set(e !== 'Participant'),
    );
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    deviceState.mobile$.subscribe((isMobile) => this.isMobile.set(isMobile));
    effect(() => {
      const thread = this.selectedThread();
      if (!thread) {
        this.currentMessages.set([]);
        return;
      }
      if (thread.fetched) {
        this.currentMessages.set([...thread.messages]);
        return;
      }
      loadMessages(thread.ref.id).subscribe((wrapped) => {
        thread.messages = wrapped.messages().map(transformMessage);
        thread.fetched = true;
        this.currentMessages.set([...thread.messages]);
      });
    });
    effect(() => {
      const threads = this.threads();
      const i18n = this.i18n();
      const lang = language();
      for (const thread of threads) {
        thread.headLine = thread.ref.name;
        thread.content =
          i18nContext(i18n.threadHeadLine, {
            date: thread.ref.created_at.toLocaleDateString(lang, {
              year: 'numeric',
              day: '2-digit',
              month: '2-digit',
            }),
          }) +
          i18nContext(i18n.threadContent, {
            time: thread.ref.created_at.toLocaleTimeString(lang, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });
      }
    });
    effect(() => {
      const elements = assistants.value();
      const r = room.value();
      if (!elements || !r) return;
      if (elements.length === 0 && !this.seen.has(r.id)) {
        this.seen.add(r.id);
        this.createDefaultAssistant();
      } else if (elements.length) {
        const assistant = untracked(() => selectedAssistant());
        if (!assistant) {
          selectAssistant(elements[0].assistant.id);
        }
      }
    });
    effect(() => {
      const s = this.state();
      if (s !== 'loading') return;
      const states = [
        ResourceStatus.Resolved,
        ResourceStatus.Error,
        ResourceStatus.Local,
      ];
      if (!states.includes(assistants.status())) return;
      if (!states.includes(threads.status())) return;
      this.state.set('ready');
    });
  }

  getDynamicI18n(key: string): string {
    const i18nObject = this.i18n();
    return key.split('.').reduce((o, i) => (o ? o[i] : null), i18nObject);
  }

  threadGroups() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const groups: { label: string; threads: ThreadEntry[] }[] = [
      { label: 'today', threads: [] },
      { label: 'yesterday', threads: [] },
      { label: 'previous_7_days', threads: [] },
      { label: 'older', threads: [] },
    ];

    const threads = this.threads();
    for (let i = threads.length - 1; i >= 0; i--) {
      const thread = threads[i];
      const threadDate = thread.ref.created_at;

      if (this.isSameDate(threadDate, today)) {
        groups[0].threads.push(thread);
      } else if (this.isSameDate(threadDate, yesterday)) {
        groups[1].threads.push(thread);
      } else if (
        threadDate < today &&
        threadDate >= sevenDaysAgo &&
        !this.isSameDate(threadDate, today) &&
        !this.isSameDate(threadDate, yesterday)
      ) {
        groups[2].threads.push(thread);
      } else if (threadDate < sevenDaysAgo) {
        groups[3].threads.push(thread);
      }
    }

    for (const group of groups) {
      group.threads.sort(
        (a, b) => b.ref.created_at.getTime() - a.ref.created_at.getTime(),
      );
    }

    return groups;
  }

  isSameDate(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  ngOnInit(): void {
    toObservable(this.state, { injector: this.injector })
      .pipe(first((v) => v === 'ready'))
      .subscribe(() => {
        this.eventService
          .on<UIComment>('gptchat-room.data')
          .pipe(takeUntil(this.destroyer), take(1))
          .subscribe((comment) => {
            this.owningComment = comment;
          });
        this.eventService.broadcast('gptchat-room.init');
      });
    this.accountState.gptConsented$
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => {
        if (!state) {
          this.openPrivacyDialog();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
  }

  protected openThread(entry: ThreadEntry) {
    this.selectedThread.set(entry);
    if (windowWatcher.isMobile()) {
      this.isOpen.set(false);
    }
  }

  protected sendMessage(msg: string, files: UploadedFile[]) {
    if ((!msg || msg.trim().length === 0) && files.length === 0) {
      return false;
    }
    if (this.state() === 'sending') {
      return false;
    }
    this.state.set('sending');
    const thread = this.selectedThread();
    const assistant = selectedAssistant();
    if (!assistant) {
      this.state.set('ready');
      return false;
    }
    const roomId = this.roomState.getCurrentRoom().id;
    let data: Observable<unknown> = of(null);
    const message: InputMessage = {
      content: msg,
      additional_kwargs: { attachments: files.map((f) => f.id) },
      type: 'human',
    };
    if (!thread) {
      data = this.assistantThread.newThread(
        roomId,
        message,
        assistant.assistant.id,
      );
    } else {
      data = this.assistantThread.continueThread(
        roomId,
        thread.ref.id,
        assistant.assistant.id,
        message,
      );
    }
    let newMessage: Message = null;
    let messageCount = -1;
    data.subscribe({
      next: (data) => {
        const sse = data as ServerSentEvent;
        // TODO: Parse all
        if (sse.event === 'thread_created') {
          const thread = new Thread(sse.jsonData() as Thread);
          const threadEntry = {
            headLine: thread.name,
            content: '',
            ref: thread,
            messages: [],
            fetched: true,
          };
          threads.update((threads) => {
            return [{ thread, messages: signal(null) }, ...threads];
          });
          this.selectedThread.set(threadEntry);
        } else if (sse.event === 'value') {
          const messages = sse.jsonData()['messages'] as BaseMessage[];
          if (newMessage == null) {
            if (messages.length > messageCount) {
              this.selectedThread().messages.push(
                transformMessage(messages[messages.length - 1]),
              );
              this.currentMessages.set([...this.selectedThread().messages]);
              messageCount = messages.length;
            }
          } else {
            const v = transformMessage(messages[messages.length - 1]);
            for (const key of Object.keys(v)) {
              newMessage[key] = v[key];
            }
            this.currentMessages.set([...this.selectedThread().messages]);
            messageCount += 1;
          }
          newMessage = null;
        } else if (sse.event === 'message') {
          if (newMessage == null) {
            newMessage = transformMessage(sse.jsonData() as BaseMessage);
            this.selectedThread().messages.push(newMessage);
            messageCount += 1;
          }
          const delta = sse.jsonData()['content'];
          if (!newMessage.content) {
            newMessage.content = [];
          }
          const data = newMessage.content as Content[];
          this.mergeObject(data, 0, {
            type: 'text',
            text: {
              value: delta,
              annotations: [],
            },
          });
          this.currentMessages.set([...this.selectedThread().messages]);
        } else {
          console.log('Unknown event', sse);
        }
      },
      error: (err) => {
        this.showError(this.makeError(err));
        console.error(err);
        this.state.set('ready');
      },
      complete: () => {
        this.state.set('ready');
      },
    });
    return true;
  }

  protected onNewClick() {
    AssistantsManageComponent.open(this.dialog, 'room');
  }

  protected deleteThread() {
    console.log('2');
    // TODO: const t = this.selectedThread();
    /*this.assistants.deleteThread(t.ref.id).subscribe({
      next: () => {
        this.threads.update((threads) => {
          return threads.filter((e) => e.ref.id !== t.ref.id);
        });
        if (this.selectedThread() === t) {
          this.selectedThread.set(null);
        }
      },
      error: (err) => {
        this.showError(this.makeError(err));
        console.error(err);
      },
    });*/
  }

  private mergeObject(data: Content[], index: number, content: Content) {
    if (data.length <= index) {
      data.length = index + 1;
    }
    const entry = data[index];
    if (!entry) {
      data[index] = content;
    } else if (entry.type !== content.type) {
      console.error('Type mismatch');
      data[index] = content;
    } else if (entry.type === 'text') {
      entry.text.value += content['text'].value;
      if (content['text'].annotations) {
        entry.text.annotations.push(...content['text'].annotations);
      }
    } else if (entry.type === 'image_url') {
      entry.image_url.url = content['image_url'].url;
      entry.image_url.detail = content['image_url'].detail;
    } else if (entry.type === 'image_file') {
      entry.image_file.file_id = content['image_file'].file_id;
      entry.image_file.detail = content['image_file'].detail;
    }
  }

  private openPrivacyDialog() {
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

  private initNav() {
    applyAiNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }

  private createDefaultAssistant() {
    if (this.roomState.getCurrentAssignedRole() === 'Participant') {
      return;
    }
    this.assistantManage
      .createRoomAssistant({
        name: i18n().defaultName,
        description: '',
        instruction: i18n().defaultInstructions,
        model_name: 'gpt-4o',
        override_json_settings: '{}',
        provider_list: '[]',
        share_type: 'MINIMAL',
      })
      .subscribe({
        next: () => {
          /*this.assistRefs.update((assistants) => {
            return [
              ...assistants,
              {
                assistant,
                files: [],
              },
            ];
          });
          this.selectedAssistant.set(assistant.id);*/
        },
        error: (err) => {
          this.error.set(this.makeError(err));
        },
      });
  }

  private showError(error: string) {
    AiErrorComponent.open(this.dialog, error);
  }

  private makeError(err: unknown): string {
    console.log(err);
    const externalError = err?.['status'] === 424;
    if (err?.['error']) {
      const error = (
        typeof err['error'] === 'string'
          ? JSON.parse(err['error'])
          : err['error']
      ) as {
        status: number;
        error: string;
        message: string;
      };
      return i18nContext(
        externalError ? i18n().openaiError : i18n().errorMessage,
        {
          message: error.status + ' ' + error.error + ': ' + error.message,
        },
      );
    }
    return JSON.stringify(err || null);
  }
}
