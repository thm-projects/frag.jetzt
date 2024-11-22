import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { HttpEventType } from '@angular/common/http';
import {
  Component,
  ElementRef,
  inject,
  model,
  output,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import {
  AssistantsService,
  UploadedFile,
} from 'app/services/http/assistants.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { AssistantUploadComponent } from './assistant-upload/assistant-upload.component';

export interface AssistantFile {
  name: string;
  ref: UploadedFile;
}

export interface SubmitEvent {
  text: string;
  files: AssistantFile[];
  reset: () => void;
}

interface FileInfo extends AssistantFile {
  status: WritableSignal<'uploading' | 'uploaded' | 'failed'>;
  progress: WritableSignal<number>;
}

@Component({
  selector: 'app-assistant-chat',
  imports: [
    CdkTextareaAutosize,
    MatInputModule,
    CustomMarkdownModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    AssistantUploadComponent,
  ],
  templateUrl: './assistant-chat.component.html',
  styleUrl: './assistant-chat.component.scss',
})
export class AssistantChatComponent {
  onSubmit = output<SubmitEvent>();
  test = signal(0);
  protected readonly text = model<string>('');
  protected readonly uploadedFiles = signal<FileInfo[]>([]);
  private readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private assistants = inject(AssistantsService);

  constructor() {
    this.increase();
  }

  increase() {
    setTimeout(() => {
      this.test.set(this.test() + 1);
    }, 250);
  }

  reset() {
    this.fileInput().nativeElement.value = '';
    this.uploadedFiles.set([]);
    this.text.set('');
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
        this.send();
        return;
      }
    }
  }

  protected onFileChange(files: FileList) {
    if (files.length === 0) {
      return;
    }
    Array.from(files).forEach((file) => this.uploadFile(file));
  }

  protected send() {
    this.onSubmit.emit({
      text: this.text(),
      files: this.uploadedFiles()
        .filter((e) => e.status() === 'uploaded')
        .map((file) => ({
          name: file.name,
          ref: file.ref,
        })),
      reset: this.reset.bind(this),
    });
  }

  protected removeFile(file: FileInfo) {
    this.uploadedFiles.update((files) => files.filter((f) => f !== file));
  }

  private uploadFile(file: File) {
    const obj: FileInfo = {
      name: file.name,
      ref: null,
      status: signal('uploading'),
      progress: signal(0),
    };
    this.uploadedFiles.update((files) => [...files, obj]);
    this.assistants.uploadFile(file).subscribe({
      next: (res) => {
        if (res.type === HttpEventType.UploadProgress) {
          obj.progress.set(Math.round((100 * res.loaded) / res.total));
        }
        if (res.type === HttpEventType.Response) {
          obj.ref = res.body;
        }
      },
      error: () => {
        obj.status.set('failed');
      },
      complete: () => {
        obj.status.set('uploaded');
      },
    });
  }
}
