import { Component, Inject, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../../shared/content-list/content-list.component';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { ContentGroup } from '../../../models/content-group';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-content-creator',
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent extends RoomPageComponent implements OnInit {
  @Input() format;
  room: Room;

  content: ContentText = new ContentText(
    '1',
    '1',
    '0',
    '',
    '',
    1,
    [],
  );
  contentGroups: ContentGroup[];
  lastCollection: string;
  myControl = new FormControl();

  editDialogMode = false;

  constructor(public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    super(roomService, route, location);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
    this.lastCollection = sessionStorage.getItem('collection');
  }

  getRoom(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
      this.contentGroups = room.contentGroups;
    });

  }

  resetInputs() {
    this.content.subject = '';
    this.content.body = '';
  }
}
