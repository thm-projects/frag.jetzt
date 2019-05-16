import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { CommentListComponent } from '../../comment-list/comment-list.component';

@Component({
  selector: 'app-delete-comment',
  templateUrl: './delete-comment.component.html',
  styleUrls: ['./delete-comment.component.scss']
})
export class DeleteCommentComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CommentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  close(type: string): void {
    this.dialogRef.close(type);
  }

}
