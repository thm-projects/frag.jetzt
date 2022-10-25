import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { switchMap } from 'rxjs';
import { DBLocalRoomSettingsService } from '../../../../services/persistence/dblocal-room-settings.service';

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

  constructor(
    public dialogRef: MatDialogRef<PseudonymEditorComponent>,
    private dBLocalRoomSettingsService: DBLocalRoomSettingsService,
  ) {}

  ngOnInit(): void {}

  accept() {
    return () => {
      this.dBLocalRoomSettingsService
        .getSettings(this.roomId, this.accountId)
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
            }
            return this.dBLocalRoomSettingsService.setOrUpdateSettings(data);
          }),
        )
        .subscribe();
      this.dialogRef.close();
    };
  }

  decline() {
    return () => this.dialogRef.close();
  }
}
