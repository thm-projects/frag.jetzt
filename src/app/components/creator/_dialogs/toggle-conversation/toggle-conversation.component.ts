import { Component, Input, OnInit } from '@angular/core';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { Room } from '../../../../models/room';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-toggle-conversation',
  templateUrl: './toggle-conversation.component.html',
  styleUrls: ['./toggle-conversation.component.scss'],
  standalone: false,
})
export class ToggleConversationComponent implements OnInit {
  @Input() editorRoom: Readonly<Room>;
  confirmButtonType: DialogConfirmActionButtonType =
    DialogConfirmActionButtonType.Alert;
  newConversationDepth: number;
  conversationAllowed: boolean;

  constructor(public dialogRef: MatDialogRef<ToggleConversationComponent>) {}

  ngOnInit() {
    this.newConversationDepth = this.editorRoom.conversationDepth;
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
