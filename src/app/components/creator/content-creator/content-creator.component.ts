import { Component, Inject, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../content-list/content-list.component';
import { Room } from '../../../models/room';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-content-creator',
  templateUrl: './content-creator.component.html',
  styleUrls: ['./content-creator.component.scss']
})
export class ContentCreatorComponent implements OnInit {
  @Input() format;
  @Input() contentGroups;

  room: Room;

  lastCollection: string;

  content: ContentText = new ContentText(
    '1',
    '1',
    '0',
    '',
    '',
    1,
    [],
  );

  myControl = new FormControl();

  editDialogMode = false;

  constructor(public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              private translateService: TranslateService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.lastCollection = sessionStorage.getItem('collection');
    console.log(this.lastCollection);
  }

  resetInputs() {
    this.content.subject = '';
    this.content.body = '';
  }
}
