import { Component, Inject } from '@angular/core';
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
export class ToggleConversationComponent {
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;
  constructor(public dialogRef: MatDialogRef<CommentSettingsComponent>,@Inject(MAT_DIALOG_DATA) public data: any,) { }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }
 toggleConversationActionCallback(): () => void {
    return () => this.dialogRef.close('confirm');
  }

  getDialogMessage(): string{
    if(this.data.conversationBlocked){
      if(this.data.directSend){
        return 'room-page.allowing-conversation-confirm-not-moderated';
      } else {
        return 'room-page.allowing-conversation-confirm-moderated';
      }
    } else{
      return 'room-page.disabling-conversation-confirm';
    }
  }
}
