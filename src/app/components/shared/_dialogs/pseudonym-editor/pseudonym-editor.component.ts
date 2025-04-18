import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy, // Import OnDestroy
} from '@angular/core';
import {
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar
// Import RxJS operators directly from 'rxjs'
import {
  Subject,
  switchMap,
  takeUntil,
  catchError,
  EMPTY,
  throwError,
  finalize,
} from 'rxjs';
import { dataService } from 'app/base/db/data-service';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './i18n.json';

// Define an interface matching the structure of a single language set in i18n.json
interface TranslationSet {
  name: string;
  title: string;
  requiredError: string;
  nameLengthError: string;
  nameWhitespaceError: string;
  leadingWhitespaceError: string;
  loadError: string;
  saveError: string;
  deleteError: string;
  global: {
    cancel: string;
    saveAndClose: string;
    delete: string;
  };
  // Add any other keys that might exist
}

// Apply the type definition to the i18n constant.
const i18n: () => TranslationSet = I18nLoader.load(rawI18n);

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
export class PseudonymEditorComponent
  implements OnInit, AfterViewInit, OnDestroy {
  // Implement OnDestroy
  @Input() roomId: string;
  @Input() accountId: string;

  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  // Make i18n public for template access
  public readonly i18n = i18n;
  isLoading = false; // Loading indicator state

  // Subject to automatically unsubscribe from observables on component destruction
  private readonly destroy$ = new Subject<void>();

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

  // Add 'readonly' to injected dependencies that are not reassigned
  constructor(
    public readonly dialogRef: MatDialogRef<PseudonymEditorComponent>, // Also mark dialogRef as readonly
    private readonly snackBar: MatSnackBar, // Mark snackBar as readonly
  ) {}

  public static open(dialog: MatDialog, accountId: string, roomId: string) {
    const ref = dialog.open(PseudonymEditorComponent);
    ref.componentInstance.accountId = accountId;
    ref.componentInstance.roomId = roomId;
    return ref;
  }

  ngOnInit(): void {
    this.loadInitialPseudonym();
    this.setupAutoTrim();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.pseudonymInputRef?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialPseudonym(): void {
    this.isLoading = true;
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Error loading pseudonym:', err);
          const msg = this.i18n().loadError || 'Could not load name.';
          this.showError(msg);
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((data) => {
        const initialValue = data?.pseudonym ?? '';
        this.questionerNameFormControl.setValue(initialValue, {
          emitEvent: false,
        });
        this.questionerNameFormControl.markAsPristine();
      });
  }

  private setupAutoTrim(): void {
    this.questionerNameFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const currentValue = value ?? '';
        const trimmed = currentValue.trimStart();
        if (currentValue !== trimmed) {
          this.questionerNameFormControl.setValue(trimmed, {
            emitEvent: false,
          });
        }
      });
  }

  get isSaveDisabled(): boolean {
    return (
      this.questionerNameFormControl.invalid ||
      this.questionerNameFormControl.pristine ||
      this.isLoading
    );
  }

  get isDeleteDisabled(): boolean {
    const value = this.questionerNameFormControl.value ?? '';
    return this.isLoading || !value || value.trim() === '';
  }

  get trimmedNameLength(): number {
    const value = this.questionerNameFormControl.value;
    return (value ?? '').trimStart().length;
  }

  accept(): void {
    if (this.questionerNameFormControl.invalid || this.isLoading) {
      this.questionerNameFormControl.markAsTouched();
      return;
    }
    const trimmedName = (this.questionerNameFormControl.value ?? '').trim();

    this.isLoading = true;
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        takeUntil(this.destroy$),
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
          return dataService.localRoomSetting.createOrUpdate(data).pipe(
            catchError((err) => {
              console.error('Error saving pseudonym:', err);
              const msg = this.i18n().saveError || 'Could not save name.';
              this.showError(msg);
              return throwError(() => err);
            }),
          );
        }),
        catchError((err) => {
          console.error('Error getting settings before saving:', err);
          const msg = this.i18n().saveError || 'Could not save name.';
          this.showError(msg);
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          // Error already shown
        },
      });
  }

  clearInput(): void {
    this.questionerNameFormControl.setValue('');
    this.questionerNameFormControl.markAsDirty();
    this.questionerNameFormControl.markAsTouched();
    this.pseudonymInputRef?.nativeElement.focus();
  }

  deletePseudonym(): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        takeUntil(this.destroy$),
        switchMap((data) => {
          if (data) {
            data.pseudonym = '';
            return dataService.localRoomSetting.createOrUpdate(data).pipe(
              catchError((err) => {
                console.error('Error deleting pseudonym:', err);
                const msg = this.i18n().deleteError || 'Could not delete name.';
                this.showError(msg);
                return throwError(() => err);
              }),
            );
          }
          return EMPTY;
        }),
        catchError((err) => {
          console.error('Error getting settings before deleting:', err);
          const msg = this.i18n().deleteError || 'Could not delete name.';
          this.showError(msg);
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: () => {
          this.questionerNameFormControl.setValue('');
          this.questionerNameFormControl.markAsPristine();
          this.dialogRef.close(true);
        },
        error: () => {
          // Error already shown
        },
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: ['error-snackbar'],
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
