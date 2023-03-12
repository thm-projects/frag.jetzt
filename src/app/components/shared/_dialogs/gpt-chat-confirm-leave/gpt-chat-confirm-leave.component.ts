import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../services/util/language.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-chat-confirm-leave.component.html',
  styleUrls: ['./gpt-chat-confirm-leave.component.scss'],
})
export class GptChatConfirmLeaveComponent implements OnInit {
  constructor(
    public langService: LanguageService,
    private dialogRef: MatDialogRef<GptChatConfirmLeaveComponent>,
  ) {}

  ngOnInit(): void {}

  onDecline(): void {
    this.dialogRef.close(false);
  }

  onAccept(): void {
    this.dialogRef.close(true);
  }
}
