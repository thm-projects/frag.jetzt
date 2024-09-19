import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, Input, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { FormControl, Validators } from '@angular/forms';
import { RoomService } from '../../../../services/http/room.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-room-name-settings',
  templateUrl: './room-name-settings.component.html',
  styleUrls: ['./room-name-settings.component.scss'],
})
export class RoomNameSettingsComponent implements OnInit {
  @Input() editRoom: Readonly<Room>;
  protected readonly i18n = i18n;
  readonly roomNameLengthMin = 3;
  readonly roomNameLengthMax = 30;
  roomNameFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.roomNameLengthMin),
    Validators.maxLength(this.roomNameLengthMax),
  ]);

  constructor(
    protected dialogRef: MatDialogRef<RoomNameSettingsComponent>,
    private roomService: RoomService,
  ) {}

  ngOnInit() {
    this.roomNameFormControl.setValue(this.editRoom.name);
    this.dialogRef.updateSize('auto');
  }

  protected save(): void {
    if (
      !this.roomNameFormControl.hasError('required') &&
      !this.roomNameFormControl.hasError('minlength') &&
      !this.roomNameFormControl.hasError('maxlength')
    ) {
      this.roomService
        .patchRoom(this.editRoom.id, {
          name: this.roomNameFormControl.value,
        })
        .subscribe();
      this.dialogRef.close('update');
    }
  }
}
