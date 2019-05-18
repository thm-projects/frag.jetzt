import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { CommentPageComponent } from '../../../shared/comment-page/comment-page.component';

@Component({
  selector: 'app-comment-export',
  templateUrl: './comment-export.component.html',
  styleUrls: ['./comment-export.component.scss']
})
export class CommentExportComponent implements OnInit {

  exportType = 'comma';

  constructor(public dialogRef: MatDialogRef<CommentPageComponent>) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

