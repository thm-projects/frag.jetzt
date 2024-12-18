import { Component, inject, input } from '@angular/core';
import { BrainstormingSession } from '../../../../models/brainstorming-session';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Comment } from 'app/models/comment';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss'],
  standalone: false,
})
export class CreateCommentComponent {
  brainstormingData = input<BrainstormingSession>(null);
  private dialogRef = inject(MatDialogRef);

  static open(
    dialog: MatDialog,
    brainstormingData: BrainstormingSession,
  ): MatDialogRef<CreateCommentComponent> {
    const ref = dialog.open(CreateCommentComponent, {
      disableClose: true,
      width: '900px',
      maxWidth: '100%',
      maxHeight: 'calc(100vh - 20px)',
      autoFocus: false,
    });
    ref.componentRef.setInput('brainstormingData', brainstormingData);
    return ref;
  }

  forward(comment?: Comment): void {
    this.dialogRef.close(comment);
  }
}
