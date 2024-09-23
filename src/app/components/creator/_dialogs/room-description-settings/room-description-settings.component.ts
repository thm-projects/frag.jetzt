import { AfterViewInit, Component, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss'],
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {
  editRoom = input.required<Readonly<Room>>();
  protected readonly i18n = i18n;
  protected data = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<RoomDescriptionSettingsComponent>,
    public translationService: TranslateService,
    protected roomService: RoomService,
  ) {}

  static open(dialog: MatDialog, room: Readonly<Room>) {
    const ref = dialog.open(RoomDescriptionSettingsComponent, {
      panelClass: 'toastui-panel',
      autoFocus: false,
      disableClose: true,
    });
    ref.componentRef.setInput('editRoom', room);
    return ref;
  }

  ngAfterViewInit() {
    if (this.editRoom) {
      this.data.set(this.editRoom().description);
    }
  }

  save(): void {
    this.roomService
      .patchRoom(this.editRoom().id, {
        description: this.data(),
      })
      .subscribe();
    this.dialogRef.close('update');
  }
}
