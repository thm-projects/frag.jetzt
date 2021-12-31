import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-comment-tag',
  templateUrl: './edit-comment-tag.component.html',
  styleUrls: ['./edit-comment-tag.component.scss']
})
export class EditCommentTagComponent implements OnInit {

  @Input() tags: string[];
  selectedTag: string;

  constructor(
    private dialogRef: MatDialogRef<EditCommentTagComponent>
  ) {
  }

  ngOnInit(): void {
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildSaveActionCallback(): () => void {
    return () => this.dialogRef.close(this.selectedTag);
  }

}
