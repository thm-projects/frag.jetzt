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
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Observable, ReplaySubject, forkJoin, of, takeUntil } from 'rxjs';
import { ForumComment } from '../../utils/data-accessor';
import { EventService } from '../../services/util/event.service';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AccountStateService } from 'app/services/state/account-state.service';
import { MatDialog } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { GptOptInPrivacyComponent } from 'app/components/shared/_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { Location } from '@angular/common';
import {
  Assistant,
  AssistantReference,
  AssistantsService,
  Content,
  Message,
  ThreadReference,
  UploadedFile,
} from 'app/services/http/assistants.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { FormControl } from '@angular/forms';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { ServerSentEvent } from 'app/utils/sse-client';
import { AiErrorComponent } from './ai-error/ai-error.component';
import { applyAiNavigation } from './navigation/ai-navigation';
import { Change, ManageAiComponent } from './manage-ai/manage-ai.component';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';

export interface AssistantEntry {
  ref: AssistantReference;
  assistant: Assistant;
}

interface ThreadEntry {
  ref: ThreadReference;
  headLine: string;
  content: string;
  fetched: boolean;
  messages: Message[];
}

interface MessageDelta {
  id: string;
  object: 'thread.message.delta';
  delta: {
    content: (Content & { index: number })[];
  };
}

@Component({
  selector: 'app-gptchat-room',
  templateUrl: './gptchat-room.component.html',
  styleUrls: ['./gptchat-room.component.scss'],
})
export class GPTChatRoomComponent implements OnInit, OnDestroy {
  @Input() protected owningComment: ForumComment;
  protected currentMessages = signal<Message[]>([]);
  protected selectedThread = signal<ThreadEntry | null>(null);
  protected threads = signal<ThreadEntry[]>([]);
  protected assistRefs = signal<AssistantEntry[]>([]);
  protected state = signal<'loading' | 'ready' | 'sending'>('loading');
  protected error = signal<string | null>(null);
  protected overrideMessage = computed(() => {
    const error = this.error();
    if (error) {
      return error;
    }
    if (this.state() === 'ready' && this.assistRefs().length === 0) {
      return i18n().noAssistants;
    }
    return '';
  });
  protected readonly isMobile = windowWatcher.isMobile;
  protected isOpen = signal(false);
  protected readonly i18n = i18n;
  protected selectedAssistant = new FormControl();
  protected isPrivileged = signal<boolean>(false);
  protected onSend = this.sendMessage.bind(this);
  private destroyer = new ReplaySubject<void>(1);
  private injector = inject(Injector);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private eventService = inject(EventService);
  private accountState = inject(AccountStateService);
  private assistants = inject(AssistantsService);
  private roomState = inject(RoomStateService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.initNav();
    const sub = this.roomState.assignedRole$.subscribe((e) =>
      this.isPrivileged.set(e !== 'Participant'),
    );
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    effect(
      () => {
        const thread = this.selectedThread();
        if (!thread) {
          this.currentMessages.set([]);
          return;
        }
        if (thread.fetched) {
          this.currentMessages.set([...thread.messages]);
          return;
        }
        this.assistants
          .getThreadMessages(thread.ref.id, null)
          .subscribe((messages) => {
            thread.messages = messages.data.reverse();
            thread.fetched = true;
            this.currentMessages.set([...thread.messages]);
          });
      },
      { allowSignalWrites: true },
    );
    effect(() => {
      const threads = this.threads();
      const i18n = this.i18n();
      const lang = language();
      for (const thread of threads) {
        thread.headLine = i18nContext(i18n.threadHeadLine, {
          date: thread.ref.createdAt.toLocaleDateString(lang, {
            year: 'numeric',
            day: '2-digit',
            month: '2-digit',
          }),
        });
        thread.content = i18nContext(i18n.threadContent, {
          time: thread.ref.createdAt.toLocaleTimeString(lang, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        });
      }
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
    this.accountState.gptConsented$
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => {
        if (!state) {
          this.openPrivacyDialog();
        }
      });
    this.roomState.room$
      .pipe(takeUntil(this.destroyer), filter(Boolean))
      .subscribe((room) => {
        let count = 0;
        this.assistants.listThreads(room.id).subscribe({
          next: (threads) => {
            this.threads.set(
              threads
                .map((e) => {
                  e.createdAt = new Date(
                    (e.createdAt as unknown as number) * 1000,
                  );
                  return {
                    headLine: '',
                    content: '',
                    ref: e,
                    messages: [],
                    fetched: false,
                  };
                })
                .sort(
                  (a, b) =>
                    b.ref.createdAt.getTime() - a.ref.createdAt.getTime(),
                ),
            );
            if (++count === 2 && this.state() === 'loading') {
              this.state.set('ready');
            }
          },
          error: (err) => {
            const error = this.error();
            const newError = this.makeError(err);
            this.error.set(error ? error + '\n' + newError : newError);
            console.error(err);
            if (++count === 2 && this.state() === 'loading') {
              this.state.set('ready');
            }
          },
        });
        this.assistants.listAssistants(room.id).subscribe({
          next: (assistants) => {
            const elements = assistants.map((e, i) => ({
              ref: e,
              assistant: {
                name: i18nContext(i18n().blankAssistant, {
                  num: String(i + 1),
                }),
              } as Assistant,
            }));
            this.assistRefs.set(elements);
            for (const assistant of elements) {
              this.loadAssistant(room.id, assistant);
            }
            if (elements.length === 0) {
              this.createDefaultAssistant(room.id);
            } else {
              this.selectedAssistant.setValue(elements[0].ref.id);
            }
            if (++count === 2 && this.state() === 'loading') {
              this.state.set('ready');
            }
          },
          error: (err) => {
            const error = this.error();
            const newError = this.makeError(err);
            this.error.set(error ? error + '\n' + newError : newError);
            console.error(err);
            if (++count === 2 && this.state() === 'loading') {
              this.state.set('ready');
            }
          },
        });
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
    const assistant = this.assistRefs().find(
      (e) => e.ref.id === this.selectedAssistant.value,
    );
    if (!assistant?.ref.openaiId) {
      this.state.set('ready');
      return false;
    }
    const message: Message = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: {
            value: msg,
            annotations: [],
          },
        },
      ],
    };
    const roomId = this.roomState.getCurrentRoom().id;
    let data: Observable<unknown> = of(null);
    if (files.length > 0) {
      data = forkJoin(
        files.map((e) => this.assistants.uploadToOpenAI(roomId, e.id)),
      ).pipe(
        map((refs) => {
          message.attachments = refs.map((ref) => ({
            file_id: ref.id,
            tools: [{ type: 'file_search' }],
          }));
          return null;
        }),
      );
    }
    if (!thread) {
      data = data.pipe(
        switchMap(() => {
          const transformedMessage = { ...message };
          transformedMessage.content =
            transformedMessage.content[0]['text'].value;
          return this.assistants.createThread(roomId, {
            assistant_id: assistant.ref.openaiId,
            stream: true,
            thread: {
              messages: [transformedMessage],
            },
          });
        }),
      );
    } else {
      data = data.pipe(
        switchMap(() => {
          const transformedMessage = { ...message };
          transformedMessage.content =
            transformedMessage.content[0]['text'].value;
          return this.assistants.continueThread(thread.ref.id, {
            assistant_id: assistant.ref.openaiId,
            stream: true,
            additional_messages: [transformedMessage],
          });
        }),
      );
    }
    let newMessage: Message = null;
    data.subscribe({
      next: (data) => {
        const sse = data as ServerSentEvent;
        if (sse.event === 'fj.created') {
          const thread = {
            headLine: '',
            content: '',
            ref: sse.jsonData() as ThreadReference,
            messages: [],
            fetched: true,
          };
          thread.ref.createdAt = new Date(
            (thread.ref.createdAt as unknown as number) * 1000,
          );
          this.threads.update((threads) => {
            return [thread, ...threads];
          });
          this.selectedThread.set(thread);
        } else if (sse.event === 'thread.run.created') {
          this.selectedThread().messages.push(message);
          this.currentMessages.set([...this.selectedThread().messages]);
        } else if (sse.event === 'thread.message.created') {
          newMessage = sse.jsonData() as Message;
          this.selectedThread().messages.push(newMessage);
          this.currentMessages.set([...this.selectedThread().messages]);
        } else if (sse.event === 'thread.message.delta') {
          const delta = sse.jsonData() as MessageDelta;
          if (!newMessage.content) {
            newMessage.content = [];
          }
          const data = newMessage.content as Content[];
          for (const content of delta.delta.content) {
            const { index, ...rest } = content;
            this.mergeObject(data, index, rest);
          }
          this.currentMessages.set([...this.selectedThread().messages]);
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
    ManageAiComponent.open(
      this.injector,
      this.assistRefs,
      this.onChange.bind(this),
    );
  }

  protected deleteThread(t: ThreadEntry, e: MouseEvent) {
    e.stopImmediatePropagation();
    this.assistants.deleteThread(t.ref.id).subscribe({
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
    });
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
    applyAiNavigation(this.injector, {
      assistants: this.assistRefs,
      onOutput: this.onChange.bind(this),
    })
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }

  private onChange(change: Change) {
    if (change.type === 'created') {
      this.assistRefs.update((assistants) => {
        return [...assistants, change.assistant];
      });
      this.loadAssistant(this.roomState.getCurrentRoom().id, change.assistant);
    } else if (change.type === 'updated') {
      this.assistRefs.update((assistants) => {
        const index = assistants.findIndex(
          (e) => e.ref.id === change.assistant.ref.id,
        );
        if (index === -1) {
          return assistants;
        }
        assistants[index] = change.assistant;
        return assistants;
      });
    } else if (change.type === 'deleted') {
      this.assistRefs.update((assistants) => {
        return assistants.filter((e) => e.ref.id !== change.assistant.ref.id);
      });
    }
  }

  private loadAssistant(roomId: string, assistant: AssistantEntry) {
    this.assistants.getAssistant(roomId, assistant.ref.openaiId).subscribe({
      next: (a) => {
        this.assistRefs.update((assistants) => {
          const index = assistants.findIndex((e) => e.ref === assistant.ref);
          if (index === -1) {
            return assistants;
          }
          a.name = a.name || assistants[index].assistant.name;
          assistants[index].assistant = a;
          return assistants;
        });
        this.selectedAssistant.updateValueAndValidity();
      },
      error: (err) => {
        this.showError(this.makeError(err));
        console.error(err);
        this.assistRefs.update((assistants) => {
          return assistants.filter((e) => e.ref !== assistant.ref);
        });
      },
    });
  }

  private createDefaultAssistant(roomId: string) {
    if (this.roomState.getCurrentAssignedRole() === 'Participant') {
      return;
    }
    this.assistants
      .createAssistant(roomId, {
        model: 'gpt-4o',
        name: i18n().defaultName,
        instructions: i18n().defaultInstructions,
        tools: [
          {
            type: 'file_search',
          },
        ],
      })
      .subscribe({
        next: (ref) => {
          const entry = {
            ref,
            assistant: {
              name: i18n().defaultName,
            } as Assistant,
          };
          this.assistRefs.update((assistants) => {
            return [...assistants, entry];
          });
          this.loadAssistant(roomId, entry);
          this.selectedAssistant.setValue(ref.id);
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
