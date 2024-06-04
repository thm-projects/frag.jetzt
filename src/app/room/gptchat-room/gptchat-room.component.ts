import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
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
import { applyRoomNavigation } from '../../navigation/room-navigation';
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

interface File {
  name: string;
  ref: UploadedFile;
}

interface AssistantEntry {
  ref: AssistantReference;
  assistant: Assistant;
}

type OverriddenMessage = Omit<Message, 'content'> & {
  content: Content[];
};

interface ThreadEntry {
  ref: ThreadReference;
  headLine: string;
  content: string;
  fetched: boolean;
  messages: OverriddenMessage[];
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
  protected currentMessages = signal<OverriddenMessage[]>([]);
  protected selectedThread = signal<ThreadEntry | null>(null);
  protected threads = signal<ThreadEntry[]>([]);
  protected assistRefs = signal<AssistantEntry[]>([]);
  protected state = signal<'loading' | 'ready' | 'sending'>('loading');
  protected isOpen = signal(false);
  protected readonly i18n = i18n;
  protected files = signal<File[]>([]);
  protected filesString = computed(() => {
    return new Intl.ListFormat(language(), {
      localeMatcher: 'best fit',
      style: 'long',
      type: 'conjunction',
    }).format(this.files().map((e) => e['name'] as string));
  });
  protected selectedAssistant = new FormControl();
  protected inputMessage = new FormControl();
  private destroyer = new ReplaySubject<void>(1);
  private injector = inject(Injector);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private eventService = inject(EventService);
  private accountState = inject(AccountStateService);
  private assistants = inject(AssistantsService);
  private roomState = inject(RoomStateService);

  constructor() {
    this.initNav();
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
            thread.messages = messages.data.reverse() as OverriddenMessage[];
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
        this.assistants.listThreads(room.id).subscribe((threads) => {
          this.threads.set(
            threads.map((e) => {
              e.createdAt = new Date((e.createdAt as unknown as number) * 1000);
              return {
                headLine: '',
                content: '',
                ref: e,
                messages: [],
                fetched: false,
              };
            }),
          );
          if (++count === 2) {
            this.state.set('ready');
          }
        });
        this.assistants.listAssistants(room.id).subscribe((assistants) => {
          const elements = assistants.map((e, i) => ({
            ref: e,
            assistant: {
              name: i18nContext(i18n().blankAssistant, { num: String(i + 1) }),
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
          if (++count === 2) {
            this.state.set('ready');
          }
        });
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
  }

  protected sendMessage() {
    if (this.state() === 'sending') {
      return;
    }
    this.state.set('sending');
    const thread = this.selectedThread();
    const assistant = this.assistRefs().find(
      (e) => e.ref.id === this.selectedAssistant.value,
    );
    if (!assistant?.ref.openaiId) {
      this.state.set('ready');
      return;
    }
    const message: Message = {
      role: 'user',
      content: this.inputMessage.value,
    };
    this.inputMessage.setValue('');
    const roomId = this.roomState.getCurrentRoom().id;
    const files = this.files();
    let data: Observable<unknown> = of(null);
    if (files.length > 0) {
      data = forkJoin(
        files.map((e) => this.assistants.uploadToOpenAI(roomId, e.ref.id)),
      ).pipe(
        map((refs) => {
          message.attachments = refs.map((ref) => ({
            file_id: ref.id,
            tools: [{ type: 'file_search' }],
          }));
          return null;
        }),
      );
      this.files.set([]);
    }
    if (!thread) {
      data = data.pipe(
        switchMap(() =>
          this.assistants.createThread(roomId, {
            assistant_id: assistant.ref.openaiId,
            stream: true,
            thread: {
              messages: [message],
            },
          }),
        ),
      );
    } else {
      data = data.pipe(
        switchMap(() =>
          this.assistants.continueThread(thread.ref.id, {
            assistant_id: assistant.ref.openaiId,
            stream: true,
            additional_messages: [message],
          }),
        ),
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
          this.threads.update((threads) => {
            return [...threads, thread];
          });
          this.selectedThread.set(thread);
        } else if (sse.event === 'thread.run.created') {
          message.content = [
            {
              type: 'text',
              text: {
                value: message.content as string,
                annotations: [],
              },
            },
          ];
          this.selectedThread().messages.push(message as OverriddenMessage);
          this.currentMessages.set([...this.selectedThread().messages]);
        } else if (sse.event === 'thread.message.created') {
          newMessage = sse.jsonData() as Message;
          this.selectedThread().messages.push(newMessage as OverriddenMessage);
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
        console.error(err);
        this.state.set('ready');
      },
      complete: () => {
        this.state.set('ready');
      },
    });
  }

  protected updateHeight(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
  }

  protected onFileChange(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.assistants.uploadFile(fileList[i]).subscribe((ref) => {
        this.files.update((files) => {
          if (
            files.findIndex(
              (e) => e.name === fileList[i].name && e.ref.id === ref.id,
            ) !== -1
          ) {
            return files;
          }
          return [...files, { name: fileList[i].name, ref }];
        });
      });
    }
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
      entry.text.annotations.push(...content['text'].annotations);
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
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
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
        model: 'gpt-3.5-turbo',
        name: i18n().defaultName,
        instructions: i18n().defaultInstructions,
        tools: [
          {
            type: 'file_search',
          },
        ],
      })
      .subscribe((ref) => {
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
      });
  }
}
