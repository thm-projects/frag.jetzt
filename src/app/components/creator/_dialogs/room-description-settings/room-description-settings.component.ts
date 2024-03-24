import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WriteCommentComponent } from '../../../shared/write-comment/write-comment.component';
import { Comment } from '../../../../models/comment';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss'],
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {
  @ViewChild(WriteCommentComponent) writeComment: WriteCommentComponent;
  @Input() editRoom: Readonly<Room>;

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public translationService: TranslateService,
    protected roomService: RoomService,
  ) {}

  ngAfterViewInit() {
    if (this.editRoom) {
      // TODO
      // this.writeComment.commentData.currentData = clone(
      //   this.editRoom.description,
      // );
    }
  }

  save(data: Comment): void {
    if (!data) {
      this.dialogRef.close();
      return;
    }
    this.roomService
      .patchRoom(this.editRoom.id, {
        description: data.body,
      })
      .subscribe();
    this.dialogRef.close('update');
  }
}
