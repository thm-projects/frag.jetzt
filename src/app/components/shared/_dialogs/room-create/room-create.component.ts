import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentService } from '../../../../services/http/content.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnInit {
  longName: string;
  shortName: string;
  emptyInputs = false;
  room: Room;
  roomId: string;

  constructor(private roomService: RoomService,
              private contentService: ContentService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<RoomCreateComponent>,
              private translateService: TranslateService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  resetEmptyInputs(): void {
    this.emptyInputs = false;
  }

  addRoom(longRoomName: string, description: string) {
    longRoomName = longRoomName.trim();
    if (!longRoomName) {
      this.emptyInputs = true;
      return;
    }
    this.roomService.addRoom({
      name: longRoomName,
      abbreviation: '00000000',
      description: description
    } as Room).subscribe(room => {
      this.room = room;
      room.commentThreshold = -100;
      let msg1: string;
      let msg2: string;
      this.translateService.get('home-page.created-1').subscribe(msg => { msg1 = msg; });
      this.translateService.get('home-page.created-2').subscribe(msg => { msg2 = msg; });
      this.notification.show(msg1 + longRoomName + msg2);
      this.router.navigate([`/creator/room/${this.room.shortId}`]);
      this.dialogRef.close();
    });
  }
}
