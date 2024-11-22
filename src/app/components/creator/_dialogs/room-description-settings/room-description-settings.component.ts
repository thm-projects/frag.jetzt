import { AfterViewInit, Component, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { NotificationService } from 'app/services/util/notification.service';
const i18n = I18nLoader.load(rawI18n);
@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss'],
  standalone: false,
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {
  editRoom = input.required<Readonly<Room>>();
  protected readonly i18n = i18n;
  data = signal<string>('');
  readonly max = 25000;

  constructor(
    public dialogRef: MatDialogRef<RoomDescriptionSettingsComponent>,
    private notification: NotificationService,
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
    if (this.data().length > this.max) {
      this.notification.show(i18n().warning);
      return;
    }
    const descriptionText = this.detectLinks(this.data());
    this.roomService
      .patchRoom(this.editRoom().id, {
        description: descriptionText,
      })
      .subscribe();
    this.dialogRef.close('update');
  }
  detectLinks(text: string): string {
    const urlRegex = /(?<!<a[^>]*?>)(https?:\/\/[^\s<]+)(?![^<]*?<\/a>)/g;

    return text.replace(urlRegex, (url: string) => {
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }
}
