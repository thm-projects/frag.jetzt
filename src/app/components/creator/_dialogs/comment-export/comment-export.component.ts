import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { CommentCreatorPageComponent } from '../../comment-creator-page/comment-creator-page.component';
import { Comment } from '../../../../models/comment';

@Component({
  selector: 'app-comment-export',
  templateUrl: './comment-export.component.html',
  styleUrls: ['./comment-export.component.scss']
})
export class CommentExportComponent implements OnInit {

  exportType = 'comma';

  constructor(public dialogRef: MatDialogRef<CommentCreatorPageComponent>) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

