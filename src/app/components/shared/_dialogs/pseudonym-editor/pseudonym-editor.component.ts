import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { switchMap } from 'rxjs/operators';
import { FormalityType } from 'app/services/http/deep-l.service';
import { dataService } from 'app/base/db/data-service';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './i18n.json';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-pseudonym-editor',
  templateUrl: './pseudonym-editor.component.html',
  styleUrls: ['./pseudonym-editor.component.scss'],
  standalone: false,
})
export class PseudonymEditorComponent implements OnInit {
  @Input()
  roomId: string;
  @Input()
  accountId: string;
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  protected readonly i18n = i18n;
  questionerNameFormControl = new FormControl('', {
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.minLength(this.questionerNameMin),
      Validators.maxLength(this.questionerNameMax),
    ],
    updateOn: 'change',
  });
  selectedFormality: FormalityType = FormalityType.Default;

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
        this.selectedFormality = data?.formality ?? FormalityType.Less;
        this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
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
              formality: this.selectedFormality,
            };
          } else {
            data.pseudonym = trimmedName;
            data.formality = this.selectedFormality;
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
    const trimmed = input.value.trim(); // Trim both leading and trailing whitespace
    if (input.value !== trimmed) {
      input.value = trimmed;
      this.questionerNameFormControl.setValue(trimmed, { emitEvent: false });
    }
  }
}
