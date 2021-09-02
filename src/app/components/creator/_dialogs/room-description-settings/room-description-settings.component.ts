import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { EventService } from '../../../../services/util/event.service';
import { Room } from '../../../../models/room';
import { FormControl, Validators } from '@angular/forms';
import { WriteCommentComponent } from '../../../shared/write-comment/write-comment.component';

@Component({
  selector: 'app-room-description-settings',
  templateUrl: './room-description-settings.component.html',
  styleUrls: ['./room-description-settings.component.scss']
})
export class RoomDescriptionSettingsComponent implements AfterViewInit {

  @ViewChild(WriteCommentComponent) writeComment: WriteCommentComponent;
  editRoom: Room;
  roomNameFormControl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]);

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected roomService: RoomService,
              public router: Router,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }


  ngAfterViewInit() {
    if (this.editRoom) {
      this.writeComment.commentData.currentData = this.editRoom.description;
    }
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog('abort');
  }

  buildSaveActionCallback(): () => void {
    return () => this.save();
  }

  closeDialog(type: string): void {
    this.dialogRef.close(type);
  }

  save(): void {
    this.editRoom.description = this.writeComment.commentData.currentData;
    this.roomService.updateRoom(this.editRoom).subscribe(r => this.editRoom = r);
    if (!this.roomNameFormControl.hasError('required')
      && !this.roomNameFormControl.hasError('minlength')
      && !this.roomNameFormControl.hasError('maxlength')) {
      this.closeDialog('update');
    }
    this.closeDialog('update');
  }

}
