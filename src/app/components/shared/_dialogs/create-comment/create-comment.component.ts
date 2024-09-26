import { Component, Input, ViewChild } from '@angular/core';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { BrainstormingSession } from '../../../../models/brainstorming-session';
import { MatDialogRef } from '@angular/material/dialog';
import { Comment } from 'app/models/comment';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss'],
})
export class CreateCommentComponent {
  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;
  @Input() userRole: UserRole;
  @Input() tags: string[];
  @Input() brainstormingData: BrainstormingSession;

  constructor(public dialogRef: MatDialogRef<CreateCommentComponent>) {}

  onNoClick(comment?: Comment): void {
    this.dialogRef.close(comment);
  }
}
