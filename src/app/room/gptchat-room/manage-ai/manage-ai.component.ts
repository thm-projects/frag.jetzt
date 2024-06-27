import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  ElementRef,
  Injector,
  Signal,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Assistant,
  AssistantsService,
} from 'app/services/http/assistants.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { NotificationService } from 'app/services/util/notification.service';
import { AssistantEntry } from '../gptchat-room.component';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface CreatedAssistant {
  type: 'created';
  assistant: AssistantEntry;
}

export interface UpdatedAssistant {
  type: 'updated';
  assistant: AssistantEntry;
}

export interface DeletedAssistant {
  type: 'deleted';
  assistant: AssistantEntry;
}

export type Change = CreatedAssistant | UpdatedAssistant | DeletedAssistant;

@Component({
  selector: 'app-manage-ai',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTabsModule,
    MatFormField,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    ContextPipe,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    CommonModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './manage-ai.component.html',
  styleUrl: './manage-ai.component.scss',
})
export class ManageAiComponent {
  assists = input.required<AssistantEntry[]>();
  updates = output<Change>();
  protected readonly i18n = i18n;
  protected state = signal<'ready' | 'loading'>('ready');
  protected createGroup = new FormGroup({
    name: new FormControl('', [Validators.maxLength(256)]),
    description: new FormControl('', [Validators.maxLength(512)]),
    model: new FormControl('gpt-4o', [Validators.required]),
    instructions: new FormControl('', [Validators.maxLength(256000)]),
    fileSearch: new FormControl(true),
    codeInterpreter: new FormControl(false),
    temperature: new FormControl(1, [Validators.min(0), Validators.max(2)]),
    top_p: new FormControl(1, [Validators.min(0), Validators.max(1)]),
  });
  protected selected = signal<AssistantEntry | null>(null);
  protected editGroup = new FormGroup({
    name: new FormControl('', [Validators.maxLength(256)]),
    description: new FormControl('', [Validators.maxLength(512)]),
    model: new FormControl('', [Validators.required]),
    instructions: new FormControl('', [Validators.maxLength(256000)]),
    fileSearch: new FormControl(false),
    codeInterpreter: new FormControl(false),
    temperature: new FormControl(1, [Validators.min(0), Validators.max(2)]),
    top_p: new FormControl(1, [Validators.min(0), Validators.max(1)]),
  });
  protected deleting = signal<string | null>(null);
  private assistants = inject(AssistantsService);
  private roomId = inject(RoomStateService).getCurrentRoom().id;
  private notification = inject(NotificationService);
  private ref = inject(ElementRef);

  constructor() {
    effect(() => {
      const selected = this.selected()?.assistant;
      this.editGroup.patchValue({
        name: selected?.name,
        description: selected?.description,
        model: selected?.model,
        instructions: selected?.instructions,
        fileSearch: selected?.tools.some((t) => t.type === 'file_search'),
        codeInterpreter: selected?.tools.some(
          (t) => t.type === 'code_interpreter',
        ),
        temperature: selected?.temperature ?? 1,
        top_p: selected?.top_p ?? 1,
      });
      if (selected) {
        this.editGroup.enable();
        setTimeout(() =>
          untracked(() => {
            this.ref.nativeElement
              ?.querySelectorAll('textarea')
              .forEach((area) => this.updateHeight(area));
          }),
        );
      } else {
        this.editGroup.disable();
      }
    });
  }

  static open(
    injector: Injector,
    data: Signal<AssistantEntry[]>,
    onOutput: (change: Change) => void,
  ) {
    const ref = injector.get(MatDialog).open(ManageAiComponent);
    const sub = ref.componentInstance.updates.subscribe(onOutput);
    const e = effect(
      () => {
        ref.componentRef.setInput('assists', data());
      },
      { manualCleanup: true, injector },
    );
    ref.componentRef.onDestroy(() => {
      sub.unsubscribe();
      e.destroy();
    });
  }

  protected create() {
    if (this.createGroup.invalid || this.state() !== 'ready') {
      return;
    }
    this.state.set('loading');
    const value = this.createGroup.value;
    const newAssistant = {
      model: value.model,
      tools: [],
    } as Assistant;
    if (value.name) {
      newAssistant.name = value.name;
    }
    if (value.description) {
      newAssistant.description = value.description;
    }
    if (value.instructions) {
      newAssistant.instructions = value.instructions;
    }
    if (value.fileSearch) {
      newAssistant.tools.push({
        type: 'file_search',
      });
    }
    if (value.codeInterpreter) {
      newAssistant.tools.push({
        type: 'code_interpreter',
      });
    }
    if (value.temperature !== 1) {
      newAssistant.temperature = value.temperature;
    }
    if (value.top_p !== 1) {
      newAssistant.top_p = value.top_p;
    }
    // Create AI
    this.assistants.createAssistant(this.roomId, newAssistant).subscribe({
      next: (assistant) => {
        this.updates.emit({
          type: 'created',
          assistant: {
            assistant: newAssistant,
            ref: assistant,
          },
        });
        this.notification.show(i18n().global.changeSuccessful);
        this.createGroup.reset({
          model: 'gpt-4o',
          temperature: 1,
          top_p: 1,
          description: '',
          instructions: '',
          fileSearch: true,
          codeInterpreter: false,
          name: '',
        });
      },
      error: () => {
        this.notification.show(i18n().global.changesGoneWrong);
        this.state.set('ready');
      },
      complete: () => {
        this.state.set('ready');
      },
    });
  }

  protected update() {
    const selected = this.selected()?.assistant;
    const ref = this.selected()?.ref;
    if (this.state() !== 'ready' || !selected) {
      return;
    }
    this.state.set('loading');
    const value = this.editGroup.value;
    const patch: Partial<Assistant> = {};
    if (value.name !== selected.name) {
      patch.name = value.name;
    }
    if (value.description !== selected.description) {
      patch.description = value.description;
    }
    if (value.instructions !== selected.instructions) {
      patch.instructions = value.instructions;
    }
    if (
      value.fileSearch !== selected.tools.some((t) => t.type === 'file_search')
    ) {
      if (value.fileSearch) {
        patch.tools = [...selected.tools, { type: 'file_search' }];
      } else {
        patch.tools = selected.tools.filter((t) => t.type !== 'file_search');
      }
    }
    if (
      value.codeInterpreter !==
      selected.tools.some((t) => t.type === 'code_interpreter')
    ) {
      if (value.codeInterpreter) {
        patch.tools = [...selected.tools, { type: 'code_interpreter' }];
      } else {
        patch.tools = selected.tools.filter(
          (t) => t.type !== 'code_interpreter',
        );
      }
    }
    if (value.model !== selected.model) {
      patch.model = value.model;
    }
    if (value.temperature !== selected.temperature) {
      patch.temperature = value.temperature;
    }
    if (value.top_p !== selected.top_p) {
      patch.top_p = value.top_p;
    }
    if (Object.keys(patch).length < 1) {
      this.state.set('ready');
      return;
    }
    this.assistants.update(ref.id, patch).subscribe({
      next: (assistant) => {
        this.updates.emit({
          type: 'updated',
          assistant: {
            assistant,
            ref,
          },
        });
        this.notification.show(i18n().global.changeSuccessful);
      },
      error: () => {
        this.notification.show(i18n().global.changesGoneWrong);
        this.state.set('ready');
      },
      complete: () => {
        this.state.set('ready');
      },
    });
  }

  protected deleteEntry(entry: AssistantEntry) {
    if (this.deleting() || this.state() !== 'ready') {
      return;
    }
    this.deleting.set(entry.ref.id);
    this.state.set('loading');
    this.state.set('ready');
    this.assistants.delete(entry.ref.id).subscribe({
      next: () => {
        this.updates.emit({
          type: 'deleted',
          assistant: entry,
        });
        this.notification.show(i18n().global.changeSuccessful);
      },
      error: () => {
        this.notification.show(i18n().global.changesGoneWrong);
        this.state.set('ready');
        this.deleting.set(null);
      },
      complete: () => {
        this.state.set('ready');
        this.deleting.set(null);
      },
    });
  }

  protected updateHeight(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
  }
}
