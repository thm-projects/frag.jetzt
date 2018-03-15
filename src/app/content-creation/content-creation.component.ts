import { Component, Inject, OnInit } from '@angular/core';
import { ContentService } from '../content.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';
import { Content } from '../content';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomComponent } from '../room/room.component';

@Component({
  selector: 'app-content-creation',
  templateUrl: './content-creation.component.html',
  styleUrls: ['./content-creation.component.scss']
})
export class ContentCreationComponent implements OnInit {
  subject: string;
  body: string;
  roomId: string;
  emptyInputs = false;

  constructor(private contentService: ContentService,
              private router: Router,
              private notification: NotificationService) {
  }

  onNoClick(): void {
  }

  ngOnInit() {
  }

  resetEmptyInputs(): void {
    this.emptyInputs = false;
  }

  addContent(subject: string, body: string) {
    subject = subject.trim();
    body = body.trim();
    if (!subject || !body) {
      this.emptyInputs = true;
      return;
    }
    this.contentService.addContent({ subject: subject, body: body, roomId: this.roomId } as Content)
      .subscribe(content => {
        this.notification.show(`Content '${content.subject}' successfully created.`);
        // this.router.navigate([`/creator/room/${content.roomId}/${content.contentId}`]);
      });
  }
}
