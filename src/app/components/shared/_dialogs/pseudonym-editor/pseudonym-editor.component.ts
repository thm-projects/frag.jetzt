import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { dataService } from 'app/base/db/data-service';
import { FormalityType } from 'app/services/http/deep-l.service';
import { switchMap } from 'rxjs';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-pseudonym-editor',
  templateUrl: './pseudonym-editor.component.html',
  styleUrls: ['./pseudonym-editor.component.scss'],
})
export class PseudonymEditorComponent implements OnInit {
  @Input()
  roomId: string;
  @Input()
  accountId: string;
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  protected readonly i18n = i18n;
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin),
    Validators.maxLength(this.questionerNameMax),
  ]);
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
        this.selectedFormality = FormalityType.Default;
        this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
      });
  }

  accept() {
    if (this.questionerNameFormControl.errors) {
      return;
    }
    dataService.localRoomSetting
      .get([this.roomId, this.accountId])
      .pipe(
        switchMap((data) => {
          if (!data) {
            data = {
              accountId: this.accountId,
              roomId: this.roomId,
              pseudonym: this.questionerNameFormControl.value,
            };
          } else {
            data.pseudonym = this.questionerNameFormControl.value;
            //data.formality = this.selectedFormality;
          }
          return dataService.localRoomSetting.createOrUpdate(data);
        }),
      )
      .subscribe();
    this.dialogRef.close();
  }
}
