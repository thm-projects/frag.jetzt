import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { BrainstormingSession } from '../../../../models/brainstorming-session';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;
  @Input() userRole: UserRole;
  @Input() tags: string[];
  @Input() brainstormingData: BrainstormingSession;

  constructor(
    public dialogRef: MatDialogRef<CreateCommentComponent>,
  ) {
  }

  ngOnInit() {
  }

  onNoClick(comment?: Comment): void {
    this.dialogRef.close(comment);
  }
}
