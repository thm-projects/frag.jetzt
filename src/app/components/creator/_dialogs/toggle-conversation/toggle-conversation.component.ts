import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommentSettingsComponent } from '../comment-settings/comment-settings.component';
import {
  DialogConfirmActionButtonType
} from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-toggle-conversation',
  templateUrl: './toggle-conversation.component.html',
  styleUrls: ['./toggle-conversation.component.scss']
})
export class ToggleConversationComponent implements OnInit {
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;
  newConversationDepth: number;
  conversationAllowed: boolean;

  constructor(
    public dialogRef: MatDialogRef<CommentSettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit() {
    this.newConversationDepth = this.data.conversationDepth;
    this.conversationAllowed = this.newConversationDepth !== 0;
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  toggleConversationActionCallback(): () => void {
    if (this.conversationAllowed) {
      this.newConversationDepth = 7;
    } else {
      this.newConversationDepth = 0;
    }
    return () => this.dialogRef.close(this.newConversationDepth);
  }
}
