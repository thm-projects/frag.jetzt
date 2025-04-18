import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
}

const i18n: () => TranslationSet = I18nLoader.load(rawI18n);

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
  @Input() roomId: string;
  @Input() accountId: string;

  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  public readonly i18n = i18n;
  isLoading = false;

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

  constructor(
    public readonly dialogRef: MatDialogRef<PseudonymEditorComponent>,
    private readonly snackBar: MatSnackBar,
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
    // Needs setTimeout to ensure the element is rendered and available for focus.
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
          // Return EMPTY to prevent the observable chain from completing on error
          return EMPTY;
        }),
        // Ensure loading state is reset regardless of success/error
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((data) => {
        const initialValue = data?.pseudonym ?? '';
        this.questionerNameFormControl.setValue(initialValue, {
          // Avoid triggering valueChanges on initial set
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
            // Update the form control value without triggering another valueChange event immediately
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
              // Propagate the error to the outer catchError
              return throwError(() => err);
            }),
          );
        }),
        // Catch errors from the initial 'get' operation
        catchError((err) => {
          console.error('Error getting settings before saving:', err);
          const msg = this.i18n().saveError || 'Could not save name.';
          this.showError(msg);
          // Prevent the observable chain from completing on error
          return EMPTY;
        }),
        // Ensure loading state is reset
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        // Error handling is done in catchError, no further action needed here
        error: () => {},
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
            // Set pseudonym to empty string to effectively delete it
            data.pseudonym = '';
            return dataService.localRoomSetting.createOrUpdate(data).pipe(
              catchError((err) => {
                console.error('Error deleting pseudonym:', err);
                const msg = this.i18n().deleteError || 'Could not delete name.';
                this.showError(msg);
                // Propagate error
                return throwError(() => err);
              }),
            );
          }
          // If no data exists, there's nothing to delete
          return EMPTY;
        }),
        // Catch errors from the initial 'get' operation
        catchError((err) => {
          console.error('Error getting settings before deleting:', err);
          const msg = this.i18n().deleteError || 'Could not delete name.';
          this.showError(msg);
          // Prevent completion on error
          return EMPTY;
        }),
        // Ensure loading state is reset
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: () => {
          this.questionerNameFormControl.setValue('');
          this.questionerNameFormControl.markAsPristine();
          this.dialogRef.close(true);
        },
        // Error handling is done in catchError
        error: () => {},
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Replaces placeholders like {{key}} in a template string with values from params.
   * Used for dynamic i18n strings.
   */
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
