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
  AssistantsService,
  FileObject,
  Message,
  UploadedFile,
} from 'app/services/http/assistants.service';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RoomStateService } from 'app/services/state/room-state.service';

interface File {
  name: string;
  ref: UploadedFile;
}

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
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent {
  messages = input.required<Message[]>();
  canSend = input.required<boolean>();
  overrideMessage = input<string>();
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
  protected files = signal<File[]>([]);
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
  private assistants = inject(AssistantsService);
  private roomState = inject(RoomStateService);

  constructor() {
    effect(() => {
      this.messages();
      this.scroll().nativeElement.scrollTop =
        this.scroll().nativeElement.scrollHeight;
    });
  }

  protected sendMessage() {
    if (
      this.onSend()(
        this.inputMessage.value,
        this.files().map((e) => e.ref),
      )
    ) {
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
