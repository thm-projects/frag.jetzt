import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';


@Component({
  selector: 'app-collection-add',
  templateUrl: './collection-add.component.html',
  styleUrls: ['./collection-add.component.scss']
})
export class CollectionAddComponent implements OnInit {

  name: string;
  emptyInputs = false;

  constructor(private roomService: RoomService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<CollectionAddComponent>,
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
