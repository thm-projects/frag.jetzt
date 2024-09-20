import {
  AfterViewInit,
  Component,
  Input,
  ViewChild,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WriteCommentComponent } from '../../../shared/write-comment/write-comment.component';
import { MatDialogRef } from '@angular/material/dialog';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss'],
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {
  @ViewChild(WriteCommentComponent) writeComment: WriteCommentComponent;
  @Input() editRoom: Readonly<Room>;
  protected readonly i18n = i18n;
  data = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<RoomDescriptionSettingsComponent>,
    public translationService: TranslateService,
    protected roomService: RoomService,
  ) {}

  ngAfterViewInit() {
    if (this.editRoom) {
      this.data.set(this.editRoom.description);
    }
  }

  save(): void {
    this.roomService
      .patchRoom(this.editRoom.id, {
        description: this.data(),
      })
      .subscribe();
    this.dialogRef.close('update');
  }
}
