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

@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss'],
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {
  @ViewChild(WriteCommentComponent) writeComment: WriteCommentComponent;
  @Input() editRoom: Readonly<Room>;
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
