import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.loadModule(rawI18n);
import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AssistantsService,
  FileObject,
} from 'app/services/http/assistants.service';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RoomStateService } from 'app/services/state/room-state.service';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AssistantChatComponent,
  SubmitEvent,
} from '../../assistant-route/assistant-chat/assistant-chat.component';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import {
  AssistantFileService,
  UploadedFile,
} from 'app/room/assistant-route/services/assistant-file.service';
import { BaseMessage } from 'app/room/assistant-route/services/assistant-thread.service';

interface OverriddenMessage extends BaseMessage {
  chunks: string[];
  attached: [number, string][];
  references: {
    name: string;
    text: string;
    id: string;
    additional_infos: string[];
  }[];
}

interface FileReference {
  id: string;
  file: FileObject;
}

@Component({
  selector: 'app-ai-chat',
  imports: [
    MatCardModule,
    CustomMarkdownModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    ContextPipe,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatSelectModule,
    AssistantChatComponent,
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent {
  messages = input.required<BaseMessage[]>();
  deleteThread = output<void>();
  selectedThread = input.required<unknown | null>();
  canSend = input.required<boolean>();
  isPrivileged = input.required<boolean>();
  overrideMessage = input<string>();
  onNewClick = input.required<() => void>();
  defaultText = input('');
  onSend =
    input.required<(message: string, files: UploadedFile[]) => boolean>();
  protected fileReference = signal<FileReference[]>([]);
  protected updatedMessages = computed(() => {
    const messages = this.messages() as OverriddenMessage[];
    const fileReference = this.fileReference();
    const startSize = fileReference.length;
    let previous = null;
    messages.forEach((message) => {
      message.chunks = this.chunkMessage(fileReference, message, previous);
      message.attached =
        (message.additional_kwargs?.attachments as unknown[])?.map((e) =>
          this.getFile(fileReference, e as string),
        ) || [];
      message.references =
        message['artifact']?.['documents'].map((e) => {
          const additional_infos: string[] = [];
          for (const key of Object.keys(e['metadata'])) {
            if (['id', 'ref_id', 'name'].includes(key)) {
              continue;
            }
            additional_infos.push(`${key}: ${e['metadata'][key]}`);
          }
          return {
            name: e['metadata']['name'],
            id: e['metadata']['id'],
            text: e['page_content'],
            additional_infos,
          };
        }) || [];
      previous = message;
    });
    if (startSize !== fileReference.length) {
      untracked(() => {
        this.fileReference.set([...fileReference]);
      });
    }
    return messages;
  });
  protected readonly i18n = i18n;
  private scroll = viewChild('scroll', {
    read: ElementRef<HTMLElement>,
  });
  protected follow = signal(false);
  protected mobile = computed(
    () => windowWatcher.windowState() === M3WindowSizeClass.Compact,
  );
  private assistants = inject(AssistantsService);
  private roomState = inject(RoomStateService);
  private assistantFile = inject(AssistantFileService);

  exampleTopics = computed(() => [
    {
      emoji: '📚',
      question: this.i18n().exampleTopics.effectiveLearning,
    },
    {
      emoji: '🌱',
      question: this.i18n().exampleTopics.sustainableLearning,
    },
    {
      emoji: '⏰',
      question: this.i18n().exampleTopics.bestTimeToLearn,
    },
    {
      emoji: '💡',
      question: this.i18n().exampleTopics.overcomeBlocks,
    },
  ]);

  constructor() {
    effect(() => {
      this.messages();
      if (this.follow()) {
        this.scroll().nativeElement.scrollTop =
          this.scroll().nativeElement.scrollHeight;
      }
    });
  }

  protected toggleFollow() {
    this.follow.update((f) => !f);
  }

  protected buildSendMessage(text: string) {
    this.sendMessage({
      text,
      files: [],
      reset: () => {},
    });
  }

  protected sendMessage(e: SubmitEvent) {
    if (!this.canSend()) {
      return;
    }
    if (
      this.onSend()(
        e.text,
        e.files.map((e) => e.ref),
      )
    ) {
      e.reset();
    }
  }

  private chunkMessage(
    ref: FileReference[],
    message: OverriddenMessage,
    previous: OverriddenMessage,
  ): string[] {
    const chunks: string[] = [];
    for (const entry of message.content) {
      if (typeof entry === 'string') {
        chunks.push(this.replaceRefernce(entry, previous));
      } else if (entry['type'] === 'text') {
        chunks.push(this.replaceRefernce(entry['text'] as string, previous));
      } else {
        console.error('Unknown entry type:', entry);
      }
    }
    return chunks;
  }

  private replaceRefernce(text: string, message: OverriddenMessage): string {
    const regex = /†\[[0-9a-fA-F-]+\]†/gm;
    let m: RegExpExecArray;
    let lastIndex = 0;
    let result = '';
    while ((m = regex.exec(text)) !== null) {
      const id = text.substring(m.index + 2, regex.lastIndex - 2);
      const index = message?.references.findIndex((e) => e.id === id) ?? -1;
      const ref = index < 0 ? '[?]' : `[${index + 1}]`;
      result += text.substring(lastIndex, m.index) + ref;
      lastIndex = regex.lastIndex;
    }
    result += text.substring(lastIndex);
    return result;
  }

  private downloadImage(ref: FileReference[], fileId: string) {
    const index = ref.findIndex((e) => e.id === fileId);
    if (index !== -1) {
      return ref[index].file?.purpose || 'Pending...';
    }
    untracked(() => {
      this.fileReference.update((files) => {
        files.push({ id: fileId, file: null });
        return files;
      });
    });
    this.assistants
      .getFileContent(this.roomState.getCurrentRoom().id, fileId)
      .subscribe({
        next: (buffer) => {
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              '',
            ),
          );
          this.fileReference.update((files) => {
            const index = files.findIndex((e) => e.id === fileId);
            files[index].file = {
              purpose: `![Image](data:image/png;base64,${base64})`,
            } as FileObject;
            return [...files];
          });
        },
        error: (error) => {
          console.error(error);
        },
      });
    return 'Pending...';
  }

  protected delete() {
    this.deleteThread.emit();
  }

  private getFile(ref: FileReference[], fileId: string): [number, string] {
    const index = ref.findIndex((e) => e.id === fileId);
    if (index !== -1) {
      return [index + 1, ref[index].file?.filename || ''];
    }
    ref.push({ id: fileId, file: null });
    this.assistantFile.getFileInfo(fileId).subscribe({
      next: (file) => {
        this.fileReference.update((files) => {
          const index = files.findIndex((e) => e.id === fileId);
          files[index].file = {
            id: file.id,
            filename: file.name,
            bytes: 0,
            purpose: '',
            createdAt: new Date(),
            object: '',
          };
          return [...files];
        });
      },
      error: (error) => {
        console.error(error);
        this.fileReference.update((files) => {
          const index = files.findIndex((e) => e.id === fileId);
          files[index].file = {
            filename: i18n().deleted,
          } as FileObject;
          return [...files];
        });
      },
    });
    return [ref.length, ''];
  }
}
