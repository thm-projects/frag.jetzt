import { Component, Inject, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../content-list/content-list.component';
import { ContentDeleteComponent } from '../../dialogs/content-delete/content-delete.component';

@Component({
  selector: 'app-content-text-creator',
  templateUrl: './content-text-creator.component.html',
  styleUrls: ['./content-text-creator.component.scss']
})
export class ContentTextCreatorComponent implements OnInit {

  roomId: string;
  content: ContentText = new ContentText('1',
    '1',
    '0',
    '',
    '',
    1);

  editDialogMode = false;

  constructor(private contentService: ContentService,
              private notificationService: NotificationService,
              private route: ActivatedRoute,
              public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId');
  }

  resetAfterSubmit() {
    this.content.subject = '';
    this.content.body = '';
    this.notificationService.show('Content submitted. Ready for creation of new content.');
  }

  submitContent(subject: string, body: string) {
      this.contentService.addContent(new ContentText(
        '1', '1', this.roomId, subject, body, 1
      )).subscribe();
    if (this.content.body.valueOf() === '' || this.content.body.valueOf() === '') {
      this.notificationService.show('No empty fields allowed. Please check subject and body.');
      return;
    }
    this.notificationService.show('Content submitted.');
    this.contentService.addContent(new ContentText(
      '1', '1', this.roomId, subject, body, 1
    )).subscribe();
    this.resetAfterSubmit();
  }

  editDialogClose($event, action: string) {
    $event.preventDefault();
    this.dialogRef.close(action);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openDeletionContentDialog($event): void {
    $event.preventDefault();
    const dialogRef = this.dialog.open(ContentDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.content = this.content;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.dialogRef.close(result);
        }
      });
  }
}
