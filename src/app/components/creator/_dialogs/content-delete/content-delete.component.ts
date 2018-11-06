import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentType } from '../../../../models/content-type.enum';
import { Content } from '../../../../models/content';

@Component({
  selector: 'app-content-delete',
  templateUrl: './content-delete.component.html',
  styleUrls: ['./content-delete.component.scss']
})
export class ContentDeleteComponent implements OnInit {
  ContentType: typeof ContentType = ContentType;
  format: ContentType;
  content: Content;

  constructor(public dialogRef: MatDialogRef<any>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close('abort');
  }

  closeDialog(action: string) {
    this.dialogRef.close(action);
  }

  ngOnInit() {
  }
}
