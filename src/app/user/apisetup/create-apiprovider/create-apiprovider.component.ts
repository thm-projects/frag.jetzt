import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  AssistantAPIService,
  DefaultDictType,
  InputProviderSetting,
  MandatoryField,
  MandatoryFields,
  PatchProviderSetting,
  ProviderInfos,
  ProviderSetting,
} from 'app/room/assistant-route/services/assistant-api.service';
import { NotificationService } from 'app/services/util/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { UUID } from 'app/utils/ts-utils';
import { Observable } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RestrictionsManageComponent } from 'app/room/assistant-route/restrictions-manage/restrictions-manage.component';
import { AssistantRestrictionService } from 'app/room/assistant-route/services/assistant-restriction.service';

const recurse = (fields: MandatoryFields, and_operation: boolean = true) => {
  const result: MandatoryField[][] = and_operation ? [[]] : [];
  for (const field of fields) {
    let sub_result: MandatoryField[][];
    if (Array.isArray(field)) {
      sub_result = recurse(field, !and_operation);
    } else {
      sub_result = [[field]];
    }
    if (and_operation) {
      const length = result.length;
      for (let i = 0; i < length; i++) {
        const last_index = sub_result.length - 1;
        for (let j = 0; j < last_index; j++) {
          result.push([...result[i], ...sub_result[j]]);
        }
        result[i].push(...sub_result[last_index]);
      }
      continue;
    }
    result.push(...sub_result);
  }
  if (result.length === 1 && result[0].length === 0) return [];
  return result;
};

@Component({
  selector: 'app-create-apiprovider',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule,
    MatSelectModule,
    KeyValuePipe,
    MatTabsModule,
    NgTemplateOutlet,
    FormsModule,
    MatTooltipModule,
    ContextPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-apiprovider.component.html',
  styleUrl: './create-apiprovider.component.scss',
})
export class CreateAPIProviderComponent {
  protected mode = input.required<'user' | 'admin'>();
  protected inputProvider = input<ProviderSetting>();
  protected providers = signal<ProviderInfos>(null);
  protected mandatoryElements = signal<MandatoryField[][]>([]);
  protected optionalElements = signal<DefaultDictType>({});
  protected readonly i18n = i18n;
  protected selectedIndex = signal<number>(0);
  private apiService = inject(AssistantAPIService);
  private dialogRef = inject(MatDialogRef);
  private notify = inject(NotificationService);
  private formBuilder = inject(FormBuilder);
  protected form = this.formBuilder.group({
    provider: [null as string, Validators.required],
    mandatory_json_settings: this.formBuilder.group({}),
    optional_json_settings: this.formBuilder.group({}),
    restriction_id: [null as UUID],
  });
  protected saving = signal(false);
  private dialog = inject(MatDialog);
  private readonly restriction = inject(AssistantRestrictionService);

  constructor() {
    this.apiService.listProviders().subscribe((providers) => {
      this.providers.set(providers);
    });
    effect(() => {
      const mode = this.mode();
      const provider = this.inputProvider();
      if (!mode || !provider) return;
      const shouldHaveAccountId = mode === 'user';
      const hasAccountId = Boolean(provider.account_id);
      if (shouldHaveAccountId !== hasAccountId) {
        this.dialogRef.close();
        this.notify.show(i18n().wrongOpened);
      }
    });
    effect(() => {
      const provider = this.inputProvider();
      const providers = this.providers();
      if (!provider || !providers) return;
      this.onProviderInput(provider);
    });
  }

  static open(
    dialog: MatDialog,
    mode: 'user' | 'admin',
    provider?: ProviderSetting,
  ) {
    const ref = dialog.open(CreateAPIProviderComponent, {
      disableClose: true,
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
    ref.componentRef.setInput('mode', mode);
    ref.componentRef.setInput('inputProvider', provider);
    return ref;
  }

  protected close(): void {
    this.dialogRef.close();
    const restriction_id = this.form.controls['restriction_id'].value;
    if (!this.inputProvider()?.restriction_id && restriction_id) {
      this.deleteRestriction(false);
    }
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    const provider = this.form.controls['provider'].value;
    if (!provider) {
      this.notify.show(
        i18nContext(i18n().notFinished, {
          name: i18n().provider,
          key: 'provider',
        }),
      );
      this.saving.set(false);
      return;
    }
    const obj = {};
    // mandatory
    const mandatory = this.mandatoryElements();
    let mandatoryKeys = [];
    if (mandatory.length > 0) {
      const index = mandatory.length < 2 ? 0 : this.selectedIndex();
      mandatoryKeys = mandatory[index].map((e) => e.name);
    }
    for (const key of mandatoryKeys) {
      const v = this.generate(
        this.form.controls['mandatory_json_settings'].controls[key],
      );
      if (v !== null && v !== '') {
        obj[key] = v;
      } else {
        this.notify.show(
          i18nContext(i18n().notFinished, {
            name: i18n().name[key],
            key: key,
          }),
        );
        this.saving.set(false);
        return;
      }
    }
    // optional
    for (const key of Object.keys(this.optionalElements())) {
      const v = this.generate(
        this.form.controls['optional_json_settings'].controls[key],
      );
      if (v !== null && v !== '') {
        obj[key] = v;
      }
    }
    // create
    const restriction_id = this.form.controls['restriction_id'].value;
    const json_settings = JSON.stringify(obj);
    const mode = this.mode();
    let obs: Observable<ProviderSetting>;
    if (!this.inputProvider()) {
      const inputProvider = {
        provider,
        json_settings,
        restriction_id,
      } satisfies InputProviderSetting;
      obs =
        mode === 'user'
          ? this.apiService.createSetting(inputProvider)
          : this.apiService.createAdminSetting(inputProvider);
    } else {
      // changes
      const inputProvider = this.inputProvider();
      const changes: PatchProviderSetting = {
        id: inputProvider.id,
      };
      let added = false;
      if (inputProvider.provider !== provider) {
        changes.provider = provider;
        added = true;
      }
      if (inputProvider.json_settings !== json_settings) {
        changes.json_settings = json_settings;
        added = true;
      }
      if (inputProvider.restriction_id !== restriction_id) {
        changes.restriction_id = restriction_id;
        added = true;
      }
      if (!added) {
        this.notify.show(i18n().noChanges);
        this.dialogRef.close();
        this.saving.set(false);
        return;
      }
      obs =
        mode === 'user'
          ? this.apiService.patchSetting(changes)
          : this.apiService.patchAdminSetting(changes);
    }
    obs.subscribe({
      next: (setting) => {
        this.saving.set(false);
        this.dialogRef.close(setting);
        this.notify.show(i18n().global.changeSuccessful);
      },
      error: () => {
        this.saving.set(false);
        this.notify.show(i18n().global.changesGoneWrong);
      },
    });
  }

  protected addRestriction() {
    const ref = RestrictionsManageComponent.open(this.dialog, null, 'user');
    ref.afterClosed().subscribe((id) => {
      this.form.get('restriction_id').setValue(id);
    });
  }

  protected editRestriction() {
    const ref = RestrictionsManageComponent.open(
      this.dialog,
      this.form.get('restriction_id').value,
      'user',
    );
    ref.afterClosed().subscribe((id) => {
      if (!id) {
        return;
      }
      this.form.get('restriction_id').setValue(id);
    });
  }

  protected deleteRestriction(showInfo = true) {
    const id = this.form.get('restriction_id').value;
    this.restriction.deleteUserRestriction(id).subscribe({
      next: () => this.form.get('restriction_id').reset(),
      error: () => {
        if (showInfo) {
          this.notify.show(i18n().global.changesGoneWrong);
        }
      },
    });
  }

  protected getControl(id: string) {
    const control = id
      .split('.')
      .reduce((obj, e) => (obj as FormGroup).get(e), this.form);
    return control as FormControl;
  }

  protected getFormArray(id: string) {
    const control = id
      .split('.')
      .reduce((obj, e) => (obj as FormGroup).get(e), this.form);
    return control as FormArray;
  }

  protected castGroup(t: AbstractControl) {
    return t as FormGroup;
  }

  protected addToArray(arr: FormArray, name: string, type: string) {
    name = name.trim();
    if (arr.controls.find((e) => e['controls']['key'].value === name)) {
      this.notify.show(i18n().alreadyExists);
      return;
    }
    arr.push(
      new FormGroup({
        key: new FormControl(name),
        type: new FormControl(type),
        value: new FormControl(),
      }),
    );
  }

  protected removeFromArr(arr: FormArray, i: number) {
    arr.removeAt(i);
  }

  protected checkIsProvider(formValue, selectionValue) {
    return formValue === selectionValue;
  }

  protected getType(type: unknown) {
    if (typeof type === 'string') {
      const types = type.split('|').filter((e) => e !== 'null');
      if (types.length === 1) return types[0];
      console.warn('Type not valid', type);
      return null;
    } else if (Array.isArray(type)) {
      const types = type.filter((e) => e !== 'null');
      if (types.length === 1) return types[0];
      console.warn('Type not valid', type);
      return null;
    }
    console.warn('Type not valid', type);
    return null;
  }

  protected onProviderChange(value: string) {
    const info = this.providers()[value];
    const group = new FormGroup({});
    const data = recurse(info.mandatory);
    for (const elem of data) {
      for (const field of elem) {
        if (group.controls[field.name]) {
          continue;
        }
        group.addControl(
          field.name,
          new FormControl(null, Validators.required),
        );
      }
    }
    this.form.setControl('mandatory_json_settings', group);
    this.mandatoryElements.set(data);

    const group2 = new FormGroup({});
    for (const key of Object.keys(info.optional)) {
      if (group2.controls[key]) {
        continue;
      }
      const type = this.getType(info.optional[key].type);
      if (typeof type === 'object') {
        const group3 = new FormGroup({});
        for (const key2 of Object.keys(type)) {
          group3.addControl(key2, new FormControl());
        }
        group2.addControl(key, group3);
      } else if (type === 'dict') {
        group2.addControl(key, new FormArray([]));
      } else {
        group2.addControl(key, new FormControl(null));
      }
    }
    this.form.setControl('optional_json_settings', group2);
    this.optionalElements.set(info.optional);
  }

  private onProviderInput(input: ProviderSetting) {
    this.form.get('provider').setValue(input.provider);
    this.form.get('restriction_id').setValue(input.restriction_id);
    const info = this.providers()[input.provider];
    const group = new FormGroup({});
    const data = recurse(info.mandatory);
    const inputData = JSON.parse(input.json_settings || '{}') || {};
    for (const elem of data) {
      for (const field of elem) {
        if (group.controls[field.name]) {
          continue;
        }
        group.addControl(
          field.name,
          new FormControl(inputData[field.name], Validators.required),
        );
      }
    }
    this.form.setControl('mandatory_json_settings', group);
    this.mandatoryElements.set(data);

    const group2 = new FormGroup({});
    for (const key of Object.keys(info.optional)) {
      if (group2.controls[key]) {
        continue;
      }
      const type = this.getType(info.optional[key].type);
      if (typeof type === 'object') {
        const group3 = new FormGroup({});
        for (const key2 of Object.keys(type)) {
          group3.addControl(key2, new FormControl(inputData[key][key2]));
        }
        group2.addControl(key, group3);
      } else if (type === 'dict') {
        const array = new FormArray([]);
        const subData = inputData[key];
        for (const key2 of Object.keys(subData)) {
          const value = subData[key2];
          const type =
            typeof value === 'string' ? 'text' : value <= 2 ? 'float' : 'int';
          array.push(
            new FormGroup({
              key: new FormControl(key2),
              type: new FormControl(type),
              value: new FormControl(value),
            }),
          );
        }
        group2.addControl(key, array);
      } else {
        group2.addControl(key, new FormControl(inputData[key]));
      }
    }
    this.form.setControl('optional_json_settings', group2);
    this.optionalElements.set(info.optional);
  }

  private generate(control: AbstractControl) {
    if (control instanceof FormControl) {
      return control.value;
    }
    if (control instanceof FormGroup) {
      const data = {};
      let added = false;
      for (const key of Object.keys(control.controls)) {
        const value = this.generate(control.get(key));
        if (value !== null && value !== '') {
          added = true;
          data[key] = value;
        }
      }
      return added ? data : null;
    }
    if (control instanceof FormArray) {
      const data = {};
      let added = false;
      for (const group of control.controls as FormGroup[]) {
        const value = this.generate(group.controls['value']);
        if (value !== null && value !== '') {
          added = true;
          data[group.controls['key'].value] = value;
        }
      }
      return added ? data : null;
    }
    return null;
  }
}
