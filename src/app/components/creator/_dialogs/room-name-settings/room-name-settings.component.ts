import { Component, Input, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { RoomService } from '../../../../services/http/room.service';

@Component({
  selector: 'app-room-name-settings',
  templateUrl: './room-name-settings.component.html',
  styleUrls: ['./room-name-settings.component.scss']
})
export class RoomNameSettingsComponent implements OnInit {

  @Input() editRoom: Room;
  roomNameFormControl = new FormControl('', [
    Validators.required, Validators.minLength(3), Validators.maxLength(20)
  ]);

  constructor(private dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              private roomService: RoomService) {
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
      this.editRoom.name = this.roomNameFormControl.value;
      this.roomService.updateRoom(this.editRoom).subscribe(r => this.editRoom = r);
      this.dialogRef.close('update');
    }
  }
}
