import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-collection-select',
  templateUrl: './collection-select.component.html',
  styleUrls: ['./collection-select.component.scss']
})
export class CollectionSelectComponent implements OnInit {

  name: string;
  emptyInputs = false;
  room: Room;
  roomId: string;
  collections: string[] = ['ARSnova', 'Angular', 'HTML', 'TypeScript' ];

  constructor(private roomService: RoomService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<CollectionSelectComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }

  resetEmptyInputs(): void {
    this.emptyInputs = false;
  }

}
