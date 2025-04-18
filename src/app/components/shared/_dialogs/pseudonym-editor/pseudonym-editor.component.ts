import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import {
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { switchMap } from 'rxjs/operators';
import { dataService } from 'app/base/db/data-service';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './i18n.json';

const i18n = I18nLoader.load(rawI18n);

// Custom validator to prevent leading whitespace in the input value.
function noLeadingWhitespaceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value as string;
  if (value?.startsWith(' ')) {
    return { leadingWhitespace: true };
  }
  return null;
}

@Component({
  selector: 'app-pseudonym-editor',
  templateUrl: './pseudonym-editor.component.html',
  styleUrls: ['./pseudonym-editor.component.scss'],
  standalone: false,
})
export class PseudonymEditorComponent implements OnInit, AfterViewInit {
  @Input() roomId: string;
  @Input() accountId: string;

  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  protected readonly i18n = i18n;

  questionerNameFormControl = new FormControl('', {
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.minLength(this.questionerNameMin),
      Validators.maxLength(this.questionerNameMax),
      noLeadingWhitespaceValidator,
    ],
    updateOn: 'change',
  });

  @ViewChild('pseudonymInput') pseudonymInputRef: ElementRef<HTMLInputElement>;

  constructor(public dialogRef: MatDialogRef<PseudonymEditorComponent>) {}

  public static open(dialog: MatDialog, accountId: string, roomId: string) {
    const ref = dialog.open(PseudonymEditorComponent);
    ref.componentInstance.accountId = accountId;
    ref.componentInstance.roomId = roomId;
    return ref;
  }

  ngOnInit(): void {
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .subscribe((data) => {
        this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
      });

    // Auto-trimming leading whitespace for better UX.
    this.questionerNameFormControl.valueChanges.subscribe((value) => {
      const trimmed = value ? value.trimStart() : value;
      if (value !== trimmed) {
        this.questionerNameFormControl.setValue(trimmed, { emitEvent: false });
      }
    });
  }

  ngAfterViewInit(): void {
    // Focus the input field after view initialization.
    setTimeout(() => {
      this.pseudonymInputRef?.nativeElement.focus();
    });
  }

  get isSaveDisabled(): boolean {
    return (
      this.questionerNameFormControl.invalid ||
      this.questionerNameFormControl.pristine
    );
  }

  get isClearDisabled(): boolean {
    return !this.questionerNameFormControl.value;
  }

  // Returns the length of the input after removing leading whitespace.
  get trimmedNameLength(): number {
    const value = this.questionerNameFormControl.value;
    return value ? value.replace(/^\s+/, '').length : 0;
  }

  accept() {
    if (this.questionerNameFormControl.errors) {
      this.questionerNameFormControl.markAsTouched();
      return;
    }
    const trimmedName = this.questionerNameFormControl.value.trim();
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        switchMap((data) => {
          if (!data) {
            data = {
              accountId: this.accountId,
              roomId: this.roomId,
              pseudonym: trimmedName,
            };
          } else {
            data.pseudonym = trimmedName;
          }
          return dataService.localRoomSetting.createOrUpdate(data);
        }),
      )
      .subscribe();
    this.dialogRef.close();
  }

  clearInput(): void {
    this.questionerNameFormControl.setValue('');
    this.questionerNameFormControl.markAsDirty();
    this.questionerNameFormControl.markAsTouched();
  }

  onInputTrim(event: Event): void {
    const input = event.target as HTMLInputElement;
    const trimmedValue = input.value.replace(/^\s+/, '');
    if (trimmedValue !== input.value) {
      input.value = trimmedValue;
      this.questionerNameFormControl.setValue(trimmedValue);
    }
  }

  deletePseudonym(): void {
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        switchMap((data) => {
          if (data) {
            data.pseudonym = '';
            return dataService.localRoomSetting.createOrUpdate(data);
          }
          return [];
        }),
      )
      .subscribe(() => {
        this.questionerNameFormControl.setValue('');
        this.questionerNameFormControl.markAsPristine();
        this.questionerNameFormControl.markAsTouched();
        this.dialogRef.close();
      });
  }

  replaceI18n(
    template: string,
    params: Record<string, string | number>,
  ): string {
    if (!template || !params) return template;
    return Object.keys(params).reduce(
      (acc, key) =>
        acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(params[key])),
      template,
    );
  }
}
