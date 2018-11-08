import { Component, Inject, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../../shared/content-list/content-list.component';
import { Room } from '../../../models/room';

@Component({
  selector: 'app-content-creator',
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  @Input() format;
  @Input() contentGroups;

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

  lastCollection: string;
  myControl = new FormControl();

  editDialogMode = false;

  constructor(public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
  }

  resetInputs() {
    this.content.subject = '';
    this.content.body = '';
  }
}
