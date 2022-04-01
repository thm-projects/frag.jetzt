import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WriteCommentComponent } from '../../../shared/write-comment/write-comment.component';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';

@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss']
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {

  @ViewChild(WriteCommentComponent) writeComment: WriteCommentComponent;
  @Input() editRoom: Readonly<Room>;

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public translationService: TranslateService,
    protected roomService: RoomService
  ) {
  }


  ngAfterViewInit() {
    if (this.editRoom) {
      this.writeComment.commentData.currentData = this.editRoom.description;
    }
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  buildSaveActionCallback(): (data: string) => void {
    return (data) => this.save(data);
  }

  save(data: string): void {
    this.roomService.patchRoom(this.editRoom.id, {
      description: CreateCommentKeywords.transformURLtoQuill(data, true),
    }).subscribe();
    this.dialogRef.close('update');
  }

}
