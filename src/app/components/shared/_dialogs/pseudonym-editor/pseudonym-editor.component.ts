import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormalityType } from 'app/services/http/deep-l.service';
import { DbLocalRoomSettingService } from 'app/services/persistence/lg/db-local-room-setting.service';
import { switchMap } from 'rxjs';

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
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin),
    Validators.maxLength(this.questionerNameMax),
  ]);
  selectedFormality: FormalityType = FormalityType.Default;

  constructor(
    public dialogRef: MatDialogRef<PseudonymEditorComponent>,
    private localRoomSetting: DbLocalRoomSettingService,
  ) {}

  public static open(dialog: MatDialog, accountId: string, roomId: string) {
    const ref = dialog.open(PseudonymEditorComponent);
    ref.componentInstance.accountId = accountId;
    ref.componentInstance.roomId = roomId;
    return ref;
  }

  ngOnInit(): void {
    this.localRoomSetting
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
    this.localRoomSetting
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
          return this.localRoomSetting.createOrUpdate(data);
        }),
      )
      .subscribe();
    this.dialogRef.close();
  }
}
