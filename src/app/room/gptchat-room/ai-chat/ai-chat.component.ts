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
  model,
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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { language } from 'app/base/language/language';
import {
  AssistantReference,
  AssistantsService,
  FileObject,
  Message,
  UploadedFile,
} from 'app/services/http/assistants.service';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RoomStateService } from 'app/services/state/room-state.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { MatMenuModule } from '@angular/material/menu';
import { AssistantEntry } from '../gptchat-room.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AssistantChatComponent,
  SubmitEvent,
  AssistantFile,
} from '../../assistant-route/assistant-chat/assistant-chat.component';
import { HttpEventType } from '@angular/common/http';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';

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
  standalone: true,
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
  assistRefs = input.required<AssistantEntry[]>();
  overrideMessage = input<string>();
  selectedAssistant = model.required<AssistantReference['id']>();
  onNewClick = input.required<() => void>();
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
  protected files = signal<AssistantFile[]>([]);
  protected filesString = computed(() => {
    return new Intl.ListFormat(language(), {
      localeMatcher: 'best fit',
      style: 'long',
      type: 'conjunction',
    }).format(this.files().map((e) => e.name as string));
  });
  protected inputMessage = new FormControl();
  private scroll = viewChild('scroll', {
    read: ElementRef<HTMLElement>,
  });
  private fileInput = viewChild('fileInput', {
    read: ElementRef<HTMLInputElement>,
  });
  protected follow = signal(false);
  protected mobile = computed(
    () => windowWatcher.windowState() === M3WindowSizeClass.Compact,
  );
  private assistants = inject(AssistantsService);
  private roomState = inject(RoomStateService);

  protected selectedAssistantName = computed(() => {
    const selectedId = this.selectedAssistant();
    const selectedEntry = this.assistRefs().find(
      (entry) => entry.ref.id === selectedId,
    );
    return selectedEntry ? selectedEntry.assistant.name : this.i18n().assistant;
  });

  protected sortedAssistRefs = computed(() => {
    const selectedId = this.selectedAssistant();
    const assistRefs = this.assistRefs();

    const otherAssistants = assistRefs.filter(
      (entry) => entry.ref.id !== selectedId,
    );
    const sortedOtherAssistants = otherAssistants.sort((a, b) =>
      a.assistant.name.localeCompare(b.assistant.name),
    );
    const selectedAssistant = assistRefs.find(
      (entry) => entry.ref.id === selectedId,
    );

    return selectedAssistant
      ? [selectedAssistant, ...sortedOtherAssistants]
      : sortedOtherAssistants;
  });

  exampleTopics = [
    {
      emoji: '📚',
      question: 'Wie lerne ich am effektivsten?',
    },
    {
      emoji: '🌱',
      question: 'Wie lerne ich nachhaltig?',
    },
    {
      emoji: '⏰',
      question: 'Wann lerne ich am besten?',
    },
    {
      emoji: '💡',
      question: 'Wie überwinde ich Lernblockaden?',
    },
  ];

  constructor() {
    effect(() => {
      this.messages();
      if (this.follow()) {
        this.scroll().nativeElement.scrollTop =
          this.scroll().nativeElement.scrollHeight;
      }
    });

    effect(
      () => {
        this.selectedThread();
        this.inputMessage.setValue('');
        this.files.set([]);
        this.fileInput().nativeElement.value = '';
      },
      { allowSignalWrites: true },
    );
  }

  setValue(text: string) {
    this.inputMessage.setValue(text);
  }

  protected onKeyDown(e: KeyboardEvent) {
    if (e.defaultPrevented) {
      return;
    }
    if (KeyboardUtils.isKeyEvent(e, KeyboardKey.Enter)) {
      const hasModifier =
        e.getModifierState('Meta') ||
        e.getModifierState('Alt') ||
        e.getModifierState('AltGraph') ||
        e.getModifierState('Control') ||
        e.getModifierState('Shift');
      if (hasModifier === windowWatcher.isMobile()) {
        e.preventDefault();
        this.buildSendMessage();
        return;
      }
    }
  }

  protected toggleFollow() {
    this.follow.update((f) => !f);
  }

  protected sendExampleTopic(value: string) {
    this.inputMessage.setValue(value);
    this.buildSendMessage();
  }

  protected buildSendMessage() {
    this.sendMessage({
      text: this.inputMessage.value,
      files: this.files(),
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
      this.inputMessage.setValue('');
      this.files.set([]);
      this.fileInput().nativeElement.value = '';
    }
  }

  protected updateHeight(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
  }

  protected onFileChange(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.assistants.uploadFile(fileList[i]).subscribe((event) => {
        if (event.type === HttpEventType.Response) {
          const ref = event.body;
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
        }
      });
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
    this.assistants
      .getFile(this.roomState.getCurrentRoom().id, fileId)
      .subscribe({
        next: (file) => {
          this.fileReference.update((files) => {
            const index = files.findIndex((e) => e.id === fileId);
            files[index].file = file;
            return [...files];
          });
        },
        error: (error) => {
          if (error?.error.status === 424) {
            const message = (error.error.message || '').split(
              '\n',
              2,
            )[1] as string;
            if (message.startsWith('404 ')) {
              console.log('File not found:', fileId);
              this.fileReference.update((files) => {
                const index = files.findIndex((e) => e.id === fileId);
                files[index].file = {
                  filename: i18n().deleted,
                } as FileObject;
                return [...files];
              });
              return;
            }
          }
          console.error(error);
        },
      });
    return [ref.length, ''];
  }
}
