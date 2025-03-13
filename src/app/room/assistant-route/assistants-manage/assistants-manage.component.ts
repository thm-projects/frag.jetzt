import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  Assistant,
  AssistantFile,
  AssistantManageService,
  InputAssistant,
  PatchAssistant,
  ShareType,
  WrappedAssistant,
} from '../services/assistant-manage.service';
import { AssistantAPIService } from '../services/assistant-api.service';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NotificationService } from 'app/services/util/notification.service';
import { concatMap, filter, Observable, of } from 'rxjs';
import { CollapsibleTextComponent } from './collapsible-text/collapsible-text.component';
import { UnsavedChangesDialogComponent } from './unsaved-changes-dialog/unsaved-changes-dialog.component';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { language } from 'app/base/language/language';
import { MatListModule } from '@angular/material/list';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import {
  AssistantFileService,
  UploadedFile,
} from '../services/assistant-file.service';
import { HttpEventType } from '@angular/common/http';
import { resumeWith, UUID } from 'app/utils/ts-utils';
import { assistants, selectAssistant } from '../state/assistant';
import { MatDividerModule } from '@angular/material/divider';
import { ConfirmDeletionDialogComponent } from './deletion-confirmation-dialog/confirm-deletion-dialog.component';
import { DialogResult } from './deletion-confirmation-dialog/confirm-deletion-dialog.component';

interface FileEntry {
  ref?: AssistantFile;
  file: UploadedFile;
}

interface AssistantEntry {
  assistant: Assistant;
  files: FileEntry[];
  meta: {
    subtitle: string;
    lines: string[];
  };
}

interface UploadInfo {
  file: File;
  progress: WritableSignal<number>;
}

const updateForRoom = (assists: AssistantEntry[]) => {
  const before = new Set(assistants.value()?.map((e) => e.assistant.id) || []);
  assistants.set(
    assists.map(
      (e) =>
        new WrappedAssistant({
          assistant: e.assistant,
          files: e.files.map((e) => [e.ref, e.file] as const),
        }),
    ),
  );
  const newAssistants = assists
    .map((e) => e.assistant.id)
    .filter((e) => !before.has(e));
  if (newAssistants.length) {
    selectAssistant(newAssistants[newAssistants.length - 1]);
  }
};

const DUMMY = [];

@Component({
  selector: 'app-assistants-manage',
  imports: [
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    CdkTextareaAutosize,
    MatCardModule,
    MatTooltipModule,
    MatAutocompleteModule,
    CollapsibleTextComponent,
    MatListModule,
    MatProgressBarModule,
    MatSliderModule,
    MatDividerModule,
  ],
  templateUrl: './assistants-manage.component.html',
  styleUrl: './assistants-manage.component.scss',
})
export class AssistantsManageComponent {
  mode = input.required<'user' | 'platform' | 'room'>();
  protected readonly i18n = i18n;
  private formBuilder = inject(FormBuilder);
  protected providers = signal<string[]>([]);
  readonly inputAssistant = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(250)]], // 256 by db
    description: ['', [Validators.required, Validators.maxLength(4000)]], // 4096 by db
    instruction: ['', [Validators.required, Validators.maxLength(15000)]],
    share_type: ['MINIMAL' as ShareType, Validators.required],
    model_name: ['', [Validators.required, Validators.maxLength(256)]], // 256 by db
    provider_list: new FormControl([]), // 1024 by db
    override_json_settings: this.formBuilder.array([]),
  });
  protected readonly assistants = signal<AssistantEntry[]>(DUMMY);
  protected readonly saving = signal(false);
  protected readonly editing = signal<AssistantEntry | null>(null);
  protected readonly files = signal<FileEntry[]>([]);
  protected readonly uploading = signal<UploadInfo[]>([]);
  protected readonly uploadInfo = computed(() => {
    const uploades = this.uploading();
    if (uploades.length < 1) return null;
    const [sum, finished] = uploades.reduce(
      (acc, v) => {
        const progress = v.progress();
        acc[0] += progress;
        acc[1] += progress >= 100 ? 1 : 0;
        return acc;
      },
      [0, 0],
    );
    return {
      progress: sum / uploades.length,
      finished,
      total: uploades.length,
    };
  });
  private loadedFiles: AssistantFile[] = [];
  private readonly previousState = signal<unknown>(null);
  private readonly apiService = inject(AssistantAPIService);
  private readonly manageService = inject(AssistantManageService);
  private readonly assistantFile = inject(AssistantFileService);
  private readonly notification = inject(NotificationService);
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('listRef');
  private readonly formRef = viewChild<ElementRef<HTMLElement>>('formRef');
  private ref = inject(MatDialogRef);
  private dialog = inject(MatDialog);

  constructor() {
    this.apiService.listProviders().subscribe((providers) => {
      this.providers.set(Object.keys(providers));
    });
    effect(() => this.loadAssistants());
    effect(() => {
      this.i18n();
      untracked(() => {
        this.assistants.update((list) =>
          list.map((entry) => {
            this.buildMeta(entry);
            return entry;
          }),
        );
      });
    });

    this.ref.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    this.ref.backdropClick().subscribe(() => {
      this.close();
    });
  }

  static open(dialog: MatDialog, mode: 'user' | 'platform' | 'room') {
    const ref = dialog.open(AssistantsManageComponent, {
      disableClose: true,
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
    ref.componentRef.setInput('mode', mode);
    return ref;
  }

  protected onKeyDown(event: KeyboardEvent, value: string) {
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter)) {
      event.preventDefault();
      if (value) {
        this.addJsonSetting(value);
      }
    }
  }

  protected deleteFile(index: number) {
    this.files.update((files) => {
      files.splice(index, 1);
      return [...files];
    });
  }

  protected onDrag(event: DragEvent) {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    const files: File[] = [];
    if (event.dataTransfer.items) {
      Array.from(event.dataTransfer.items).forEach((elem) => {
        if (elem.kind === 'file') {
          files.push(elem.getAsFile());
        }
      });
    } else {
      Array.from(event.dataTransfer.files).forEach((file) => files.push(file));
    }
    this.addFiles(files as unknown as FileList);
  }

  protected onFileSelect(input: HTMLInputElement) {
    this.addFiles(input.files);
    input.value = '';
  }

  protected editAssistant(entry: AssistantEntry) {
    const assistant = entry.assistant;
    const editing = this.editing();
    this.editing.set(entry);
    if (!editing) {
      this.previousState.set(this.inputAssistant.getRawValue());
    }
    const object = JSON.parse(assistant.override_json_settings || '{}');
    const overrideSettings = Object.keys(object).map((key) => ({
      property: key,
      type: key === 'temperature' ? 'select' : 'text',
      key: key,
      value: object[key],
      options: key === 'temperature' ? this.getTemperatureOptions() : [],
    }));
    this.setGroupState({
      name: assistant.name,
      description: assistant.description,
      instruction: assistant.instruction,
      share_type: assistant.share_type,
      model_name: assistant.model_name,
      provider_list: JSON.parse(assistant.provider_list || '[]'),
      override_json_settings: overrideSettings,
    });
    this.loadedFiles = entry.files.map((v) => v.ref);
    this.files.set([...entry.files]);
    this.formRef().nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected getJsonSettings() {
    const t = this.inputAssistant.get(
      'override_json_settings',
    ) as FormArray<FormGroup>;
    return t.controls;
  }

  protected addJsonSetting(key: string) {
    const t = this.inputAssistant.get(
      'override_json_settings',
    ) as FormArray<FormGroup>;
    const index = t.controls.findIndex((c) => c.get('property').value === key);
    if (index >= 0) {
      this.notification.show(this.i18n().propertyExists);
      return;
    }
    if (key === 'temperature') {
      const newEntry = this.formBuilder.group({
        property: [key],
        type: ['select'],
        key: [key, Validators.required],
        options: [this.getTemperatureOptions()],
        value: [0.5],
      });
      newEntry.get('key').disable();
      t.push(newEntry);
    } else {
      const newEntry = this.formBuilder.group({
        property: [key],
        type: ['text'],
        key: [key, Validators.required],
        value: [''],
      });
      newEntry.get('key').disable();
      t.push(newEntry);
    }
  }

  protected removeJsonSetting(index: number) {
    const t = this.inputAssistant.get(
      'override_json_settings',
    ) as FormArray<FormGroup>;
    t.removeAt(index);
  }

  protected cancelEdit() {
    if (this.hasUnsavedChanges()) {
      const dialogRef = this.dialog.open(UnsavedChangesDialogComponent);
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'discard') {
          this.reset();
          this.files.set([]);
          this.loadedFiles = null;
        }
      });
    } else {
      this.reset();
      this.files.set([]);
      this.loadedFiles = null;
    }
  }

  protected deleteAssistant(entry: AssistantEntry) {
    if (this.saving()) return;
    this.saving.set(true);
    const mode = this.mode();
    let obs: Observable<void> = of(null);
    if (mode === 'user') {
      obs = this.manageService.deleteUserAssistant(entry.assistant.id);
    } else if (mode === 'room') {
      obs = this.manageService.deleteRoomAssistant(entry.assistant.id);
    } else if (mode === 'platform') {
      obs = this.manageService.deletePlatformAssistant(entry.assistant.id);
    } else {
      console.error('Unknown mode', mode);
    }
    obs.subscribe({
      error: (err) => {
        this.saving.set(false);
        console.error(err);
        this.notification.show(this.i18n().global.changesGoneWrong);
      },
      complete: () => {
        this.assistants.update((list) =>
          list.filter((v) => v.assistant.id !== entry.assistant.id),
        );
        this.saving.set(false);
      },
    });
  }

  openConfirmDeletionDialog(entry: AssistantEntry): void {
    const dialogRef = this.dialog.open(ConfirmDeletionDialogComponent);

    dialogRef.afterClosed().subscribe((result: DialogResult) => {
      if (result === 'confirmed') {
        this.deleteAssistant(entry);
      }
    });
  }

  protected addAssistant(form: FormGroupDirective) {
    if (this.inputAssistant.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    const previousEntry = this.editing();
    const previous = previousEntry?.assistant?.id;
    const obs = this.editing()
      ? this.patchAssistant()
      : this.createNewAssistant();
    obs
      .pipe(
        concatMap((v) =>
          this.updateAssistantFiles(v?.id || previous).pipe(
            concatMap((files) => of([v, files] as const)),
          ),
        ),
      )
      .subscribe({
        next: ([assistant, files]) => {
          if (!assistant && !previousEntry) return;
          assistant = assistant || previousEntry.assistant;
          const newAssistant: AssistantEntry = {
            assistant: assistant,
            files,
            meta: { subtitle: '', lines: [] },
          };
          this.buildMeta(newAssistant);
          this.assistants.update((list) => [
            ...list.filter((v) => v.assistant.id !== assistant.id),
            newAssistant,
          ]);
        },
        error: (err) => {
          console.error(err);
          this.notification.show(this.i18n().global.changesGoneWrong);
          this.saving.set(false);
        },
        complete: () => {
          this.saving.set(false);
          this.listRef().nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        },
      });
    form.resetForm();
    this.reset();
  }

  protected hasUnsavedChanges(): boolean {
    const jsonSettingsDirty = this.getJsonSettings().some(
      (control) => control.dirty,
    );
    return (
      this.inputAssistant.dirty || this.files().length > 0 || jsonSettingsDirty
    );
  }

  protected close() {
    const assists = this.assistants();

    if (this.hasUnsavedChanges()) {
      const dialogRef = this.dialog.open(UnsavedChangesDialogComponent);
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'discard') {
          this.ref.close(assists);
        }
      });
    } else {
      if (assists === DUMMY) {
        this.ref.close(null);
      }
      if (this.mode() === 'room') {
        updateForRoom(assists);
      }
      this.ref.close(assists);
    }
  }

  private patchAssistant() {
    const assistant = this.inputAssistant.value;
    const old = this.editing().assistant;
    const patch: PatchAssistant = {
      id: old.id,
    };
    // name
    const name = assistant.name;
    if (old.name != name) {
      patch.name = name;
    }
    // description
    const description = assistant.description;
    if (old.description != description) {
      patch.description = description;
    }
    // instruction
    const instruction = assistant.instruction;
    if (old.instruction != instruction) {
      patch.instruction = instruction;
    }
    // share_type
    const share_type = assistant.share_type;
    if (old.share_type != share_type) {
      patch.share_type = share_type;
    }
    // model_name
    const model_name = assistant.model_name;
    if (old.model_name != model_name) {
      patch.model_name = model_name;
    }
    // provider_list
    const provider_list = JSON.stringify(assistant.provider_list);
    if (old.provider_list != provider_list) {
      patch.provider_list = provider_list;
    }
    // override_json_settings
    const override_json_settings = JSON.stringify(
      this.getJsonSettings().reduce((acc, curr) => {
        acc[curr.get('key').value] = curr.get('value').value;
        return acc;
      }, {}),
    );
    if (old.override_json_settings != override_json_settings) {
      patch.override_json_settings = override_json_settings;
    }
    if (Object.keys(patch).length < 2) {
      return of(null);
    }
    const mode = this.mode();
    if (mode === 'user') {
      return this.manageService.patchUserAssistant(patch);
    } else if (mode === 'room') {
      return this.manageService.patchRoomAssistant(patch);
    } else if (mode === 'platform') {
      return this.manageService.patchPlatformAssistant(patch);
    }
    console.error('Unknown mode', mode);
    return of(null);
  }

  private createNewAssistant() {
    const assistant = this.inputAssistant.value;
    const newAssistant: InputAssistant = {
      name: assistant.name,
      description: assistant.description,
      instruction: assistant.instruction,
      share_type: assistant.share_type,
      model_name: assistant.model_name,
      provider_list: JSON.stringify(assistant.provider_list),
      override_json_settings: JSON.stringify(
        this.getJsonSettings().reduce((acc, curr) => {
          acc[curr.get('key').value] = curr.get('value').value;
          return acc;
        }, {}),
      ),
    };
    const mode = this.mode();
    if (mode === 'user') {
      return this.manageService.createUserAssistant(newAssistant);
    } else if (mode === 'room') {
      return this.manageService.createRoomAssistant(newAssistant);
    } else if (mode === 'platform') {
      return this.manageService.createPlatformAssistant(newAssistant);
    }
    console.error('Unknown mode', mode);
    return of(null);
  }

  private updateAssistantFiles(assistantId: UUID) {
    const before = [...this.loadedFiles];
    const returnValue = this.files();
    const toCreate = this.files().filter((f) => {
      const index = before.findIndex((e) => e.uploaded_file_id === f.file.id);
      if (index >= 0) {
        before.splice(index, 1);
        return false;
      } else if (f.ref) {
        return false;
      }
      return true;
    });
    this.files.set([]);
    const toDelete = before;
    let start: Observable<unknown> = of(null);
    const mode = this.mode();
    // delete
    if (mode === 'user' && toDelete.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.deleteUserAssistantFiles(
            assistantId,
            toDelete.map((v) => v.uploaded_file_id),
          ),
        ),
      );
    } else if (mode === 'room' && toDelete.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.deleteRoomAssistantFiles(
            assistantId,
            toDelete.map((v) => v.uploaded_file_id),
          ),
        ),
      );
    } else if (mode === 'platform' && toDelete.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.deletePlatformAssistantFiles(
            assistantId,
            toDelete.map((v) => v.uploaded_file_id),
          ),
        ),
      );
    }
    // Create
    if (mode === 'user' && toCreate.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.createUserAssistantFiles(
            assistantId,
            toCreate.map((e) => e.file.id),
          ),
        ),
      );
    } else if (mode === 'room' && toCreate.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.createRoomAssistantFiles(
            assistantId,
            toCreate.map((e) => e.file.id),
          ),
        ),
      );
    } else if (mode === 'platform' && toCreate.length) {
      start = start.pipe(
        resumeWith(
          this.manageService.createPlatformAssistantFiles(
            assistantId,
            toCreate.map((e) => e.file.id),
          ),
        ),
      );
    }
    return start.pipe(
      filter(() => false),
      resumeWith(of(returnValue)),
    );
  }

  private reset() {
    if (this.editing()) {
      this.editing.set(null);
      const previous = this.previousState();
      this.previousState.set(null);
      this.setGroupState(
        previous as {
          name: string;
          description: string;
          instruction: string;
          share_type: ShareType;
          model_name: string;
          provider_list: string[];
          override_json_settings: {
            property: string;
            type: string;
            key: string;
            value: string;
            options: { value: number; label: string }[];
          }[];
        },
        false, // Do not mark fields as touched when resetting
      );
      return;
    }
    this.setGroupState(
      {
        name: '',
        description: '',
        instruction: '',
        share_type: 'MINIMAL',
        model_name: '',
        provider_list: [],
        override_json_settings: [],
      },
      false, // Do not mark fields as touched when resetting
    );
  }

  private setGroupState(
    state: {
      name: string;
      description: string;
      instruction: string;
      share_type: ShareType;
      model_name: string;
      provider_list: string[];
      override_json_settings: {
        property: string;
        type: string;
        key: string;
        value: string;
        options: { value: number; label: string }[];
      }[];
    },
    markAsTouched: boolean = true,
  ) {
    const length = state.override_json_settings?.length || 0;
    const t = this.inputAssistant.get(
      'override_json_settings',
    ) as FormArray<FormGroup>;

    // Adjust the FormArray size
    while (t.length > length) {
      t.removeAt(t.length - 1);
    }
    while (t.length < length) {
      const group = this.formBuilder.group({
        property: [''],
        type: ['text'],
        key: [{ value: '', disabled: true }, Validators.required],
        value: [''],
        options: [[]],
      });
      t.push(group);
    }

    // Set values for each control in the FormArray
    state.override_json_settings.forEach((item, index) => {
      t.at(index).patchValue({
        property: item.property || item.key,
        type: item.type || 'text',
        key: item.key,
        value: item.value,
        options: item.options || [],
      });
    });

    // Set the values of the main form group
    this.inputAssistant.patchValue({
      name: state.name,
      description: state.description,
      instruction: state.instruction,
      share_type: state.share_type,
      model_name: state.model_name,
      provider_list: state.provider_list,
    });
    // Mark controls as touched to update floating labels
    if (markAsTouched) {
      this.inputAssistant.markAllAsTouched();
    } else {
      this.inputAssistant.markAsPristine();
      this.inputAssistant.markAsUntouched();
    }
  }

  private loadAssistants() {
    const mode = this.mode();
    let obs: Observable<WrappedAssistant[]>;
    if (mode === 'user') {
      obs = this.manageService.listUserAssistants();
    } else if (mode === 'room') {
      obs = this.manageService.listRoomAssistants();
    } else if (mode === 'platform') {
      obs = this.manageService.listPlatformAssistants();
    }
    obs.subscribe({
      next: (wrapped) => {
        this.assistants.set(
          wrapped.map((e) => {
            const entry: AssistantEntry = {
              assistant: e.assistant,
              files: e.files.map(([ref, file]) => {
                return {
                  file,
                  ref,
                } satisfies FileEntry;
              }),
              meta: { subtitle: '', lines: [] },
            };
            this.buildMeta(entry);
            return entry;
          }),
        );
      },
    });
  }

  private addFiles(files: FileList) {
    const newElements = Array.from(files).map((file) => {
      return {
        file,
        progress: signal(0),
      } satisfies UploadInfo;
    });
    this.uploading.update((elements) => [...elements, ...newElements]);
    this.assistantFile.uploadFile(files).subscribe({
      next: (res) => {
        if (res.type === HttpEventType.UploadProgress) {
          const progress = Math.round((100 * res.loaded) / res.total);
          newElements.forEach((f) => f.progress.set(progress));
        }
        if (res.type === HttpEventType.Response) {
          const newFiles: FileEntry[] = [];
          newElements.forEach((f, i) => {
            const status = res.body[i];
            f.progress.set(100);
            if (status.result !== 'OK') {
              this.notification.show(status.reason);
              return;
            }
            newFiles.push({
              file: status.file,
            });
          });
          if (newFiles.length) {
            const set = new Set(this.files().map((v) => v.file.id));
            const set2 = new Set(newFiles.map((v) => v.file.id));
            const addFiles = newFiles.filter(
              (v) => !set.has(v.file.id) && set2.delete(v.file.id),
            );
            this.files.update((files) => [...files, ...addFiles]);
          }
          this.uploading.update((uploades) => {
            if (uploades.every((upload) => upload.progress() >= 100)) {
              return [];
            }
            return uploades;
          });
        }
      },
      error: () => {
        this.notification.show(i18n().global.changesGoneWrong);
      },
    });
  }

  private buildMeta(entry: AssistantEntry) {
    entry.meta.subtitle = i18nContext(i18n().infoShare, {
      share: i18n().shares[entry.assistant.share_type.toLowerCase()],
    });
    const overrides = Object.keys(
      JSON.parse(entry.assistant.override_json_settings) || {},
    );
    const providers = JSON.parse(entry.assistant.provider_list) || [];
    const files = entry.files.map((v) =>
      v.file?.name ? v.file.name : i18n().notLoadedFile,
    );
    const format = new Intl.ListFormat(language(), {
      style: 'long',
      type: 'conjunction',
    });
    entry.meta.lines = [
      i18nContext(i18n().infoModel, { model: entry.assistant.model_name }),
      providers.length
        ? i18nContext(i18n().infoProviders, {
            providers: format.format(providers),
          })
        : '',
      overrides.length
        ? i18nContext(i18n().infoOverrides, {
            overrides: format.format(overrides),
          })
        : '',
      files.length
        ? i18nContext(i18n().infoFiles, {
            num: String(files.length),
            files: format.format(files),
          })
        : '',
    ].filter(Boolean);
  }

  private getTemperatureOptions() {
    const numberFormat = new Intl.NumberFormat(I18nLoader.getCurrentLocale());
    return [
      { value: 0, label: this.i18n().temperature.notCreative + ' (= 0)' },
      {
        value: 0.25,
        label:
          this.i18n().temperature.somewhatCreative +
          ` (= ${numberFormat.format(0.25)})`,
      },
      {
        value: 0.5,
        label:
          this.i18n().temperature.balanced + ` (= ${numberFormat.format(0.5)})`,
      },
      {
        value: 0.75,
        label:
          this.i18n().temperature.creative +
          ` (= ${numberFormat.format(0.75)})`,
      },
      {
        value: 1,
        label: this.i18n().temperature.highlyCreative + ' (= 1)',
      },
    ];
  }
}
