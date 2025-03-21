import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { HttpEventType } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
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
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { AssistantUploadComponent } from './assistant-upload/assistant-upload.component';
import {
  AssistantFileService,
  UploadedFile,
} from '../services/assistant-file.service';
import { MatMenuModule } from '@angular/material/menu';
import {
  selectAssistant,
  selectedAssistant,
  sortedAssistants,
} from '../state/assistant';
import { AssistantsManageComponent } from '../assistants-manage/assistants-manage.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomStateService } from 'app/services/state/room-state.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface AssistantFile {
  name: string;
  ref: UploadedFile | null;
}

export interface SubmitEvent {
  text: string;
  files: AssistantFile[];
  reset: () => void;
}

interface FileInfo extends AssistantFile {
  status: WritableSignal<'uploading' | 'uploaded' | 'failed' | 'processing'>;
  progress: WritableSignal<number>;
}

@Component({
  selector: 'app-assistant-chat',
  imports: [
    MatInputModule,
    CustomMarkdownModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    AssistantUploadComponent,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './assistant-chat.component.html',
  styleUrl: './assistant-chat.component.scss',
})
export class AssistantChatComponent implements AfterViewInit {
  messageSend = output<SubmitEvent>();
  text = model<string>('');
  isSending = input.required<boolean>();
  minHeight = input.required<number>();
  protected readonly i18n = i18n;
  protected selectedAssistant = selectedAssistant;
  protected sortedAssistants = sortedAssistants;
  protected selectAssistant = selectAssistant;
  protected readonly uploadedFiles = signal<FileInfo[]>([]);
  protected isPrivileged = signal(false);
  private readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly textArea =
    viewChild<ElementRef<HTMLTextAreaElement>>('textArea');
  private file = inject(AssistantFileService);
  private dialog = inject(MatDialog);

  constructor(roomState: RoomStateService) {
    effect((onCleanup) => {
      const sub = roomState.assignedRole$.subscribe((e) =>
        this.isPrivileged.set(e !== 'Participant'),
      );
      onCleanup(() => {
        sub.unsubscribe();
      });
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.resize(this.textArea().nativeElement));
  }

  reset() {
    this.fileInput().nativeElement.value = '';
    this.uploadedFiles.set([]);
    this.text.set('');
  }

  protected resize(textArea: HTMLTextAreaElement) {
    textArea.style.height = '0';
    textArea.style.height =
      Math.max(this.minHeight(), textArea.scrollHeight) + 'px';
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
    this.uploadFiles(files);
  }

  protected send() {
    if (this.isSending()) return;
    this.messageSend.emit({
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

  protected onNewClick() {
    AssistantsManageComponent.open(this.dialog, 'room');
  }

  private uploadFiles(file: FileList) {
    const newFiles: FileInfo[] = Array.from(file).map((f) => ({
      name: f.name,
      ref: null,
      status: signal('uploading'),
      progress: signal(0),
    }));
    this.uploadedFiles.update((files) => [...files, ...newFiles]);
    this.file.uploadFile(file).subscribe({
      next: (res) => {
        if (res.type === HttpEventType.UploadProgress) {
          const progress = Math.round((100 * res.loaded) / res.total);
          newFiles.forEach((f) => f.progress.set(progress));
          if (progress >= 100) {
            newFiles.forEach((f) => f.status.set('processing'));
          }
        }
        if (res.type === HttpEventType.Response) {
          newFiles.forEach((f, i) => {
            const status = res.body[i];
            if (status.result !== 'OK') {
              f.status.set('failed');
              return;
            }
            f.ref = status.file;
            f.status.set('uploaded');
          });
        }
      },
      error: () => {
        newFiles.forEach((f) => f.status.set('failed'));
      },
    });
  }
}
