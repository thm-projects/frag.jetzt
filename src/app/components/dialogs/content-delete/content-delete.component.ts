import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomService } from '../../../services/http/room.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { ContentChoiceCreatorComponent } from '../../fragments/content-choice-creator/content-choice-creator.component';
import { ContentLikertCreatorComponent } from '../../fragments/content-likert-creator/content-likert-creator.component';
import { ContentYesNoCreatorComponent } from '../../fragments/content-yes-no-creator/content-yes-no-creator.component';
import { ContentTextCreatorComponent } from '../../fragments/content-text-creator/content-text-creator.component';
import { ContentType } from '../../../models/content-type.enum';
import { Content } from '../../../models/content';

@Component({
  selector: 'app-content-delete',
  templateUrl: './content-delete.component.html',
  styleUrls: ['./content-delete.component.scss']
})
export class ContentDeleteComponent implements OnInit {
  ContentType: typeof ContentType = ContentType;
  format: ContentType;
  content: Content;

  constructor(private roomService: RoomService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<ContentChoiceCreatorComponent>,
              public dialogRefLikert: MatDialogRef<ContentLikertCreatorComponent>,
              public dialogRefYesNo: MatDialogRef<ContentYesNoCreatorComponent>,
              public dialogRefText: MatDialogRef<ContentTextCreatorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    switch (this.format) {
      case ContentType.CHOICE:
        this.dialogRef.close();
        break;
      case ContentType.SCALE:
        this.dialogRefLikert.close();
        break;
      case ContentType.BINARY:
        this.dialogRefYesNo.close();
        break;
      case ContentType.TEXT:
        this.dialogRefText.close();
        break;
      default:
        return;
    }
  }

  closeDialog(action: string) {
    switch (this.format) {
      case ContentType.CHOICE:
        this.dialogRef.close(action);
        break;
      case ContentType.SCALE:
        this.dialogRefLikert.close(action);
        break;
      case ContentType.BINARY:
        this.dialogRefYesNo.close(action);
        break;
      case ContentType.TEXT:
        this.dialogRefText.close(action);
        break;
      default:
        return;
    }
  }

  ngOnInit() {
  }
}
