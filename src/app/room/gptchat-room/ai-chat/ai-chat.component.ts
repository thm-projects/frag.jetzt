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
  Message,
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

interface OverriddenMessage extends Message {
  chunks: string[];
  attached: [number, string][];
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
  messages = input.required<Message[]>();
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
    messages.forEach((message) => {
      message.chunks = this.chunkMessage(fileReference, message);
      message.attached =
        message.attachments?.map((e) =>
          this.getFile(fileReference, e.file_id),
        ) || [];
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
  ): string[] {
    const chunks: string[] = [];
    for (const entry of message.content) {
      if (entry.type === 'text') {
        let i = 0;
        let newString = '';
        const original = entry.text.value;
        for (const annotation of entry.text.annotations) {
          if (annotation.type === 'file_citation') {
            const index = this.getFile(
              ref,
              annotation.file_citation.file_id,
            )[0];
            newString += original.slice(i, annotation.start_index);
            newString += `<span class="file-ref">[${index}]</span>`;
            i = annotation.end_index;
          } else if (annotation.type === 'file_path') {
            newString += original.slice(i, annotation.start_index);
            newString += `[File 2](#${annotation.file_path.file_id})`;
            i = annotation.end_index;
          }
        }
        newString += original.slice(i);
        chunks.push(newString);
      } else if (entry.type === 'image_file') {
        const str = this.downloadImage(ref, entry.image_file.file_id);
        chunks.push(str);
      } else if (entry.type === 'image_url') {
        chunks.push(`![Image](${entry.image_url.url})`);
      } else {
        console.error('Unknown entry type:', entry);
      }
    }
    return chunks;
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
    console.log('1');
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
