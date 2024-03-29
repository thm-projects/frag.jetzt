import { Component, Input, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomService } from '../../../../services/http/room.service';

@Component({
  selector: 'app-room-name-settings',
  templateUrl: './room-name-settings.component.html',
  styleUrls: ['./room-name-settings.component.scss']
})
export class RoomNameSettingsComponent implements OnInit {

  @Input() editRoom: Readonly<Room>;
  readonly roomNameLengthMin = 3;
  readonly roomNameLengthMax = 30;
  roomNameFormControl = new FormControl('', [
    Validators.required, Validators.minLength(this.roomNameLengthMin), Validators.maxLength(this.roomNameLengthMax)
  ]);

  constructor(
    private dialogRef: MatDialogRef<RoomNameSettingsComponent>,
    private roomService: RoomService
  ) {
  }

  ngOnInit() {
    this.roomNameFormControl.setValue(this.editRoom.name);
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  buildConfirmDialogActionCallback(): () => void {
    return () => this.save();
  }

  private save(): void {
    if (!this.roomNameFormControl.hasError('required')
      && !this.roomNameFormControl.hasError('minlength')
      && !this.roomNameFormControl.hasError('maxlength')) {
      this.roomService.patchRoom(this.editRoom.id, {
        name: this.roomNameFormControl.value
      }).subscribe();
      this.dialogRef.close('update');
    }
  }
}
