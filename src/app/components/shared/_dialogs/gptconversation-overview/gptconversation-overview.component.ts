import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  GPTConversation,
  GPTConversationService,
} from 'app/services/http/gptconversation.service';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-gptconversation-overview',
  templateUrl: './gptconversation-overview.component.html',
  styleUrls: ['./gptconversation-overview.component.scss'],
  standalone: false,
})
export class GPTConversationOverviewComponent implements OnInit {
  roomConversations: GPTConversation[] = [];
  otherConversations: GPTConversation[] = [];
  displayedColumns: string[] = [
    'date',
    'lastMessage',
    'firstMessage',
    'delete',
  ];
  currentId: string;
  protected iteration: [string, GPTConversation[]][] = [
    ['gptconversation-overview.this-room', this.roomConversations],
    ['gptconversation-overview.other-room', this.otherConversations],
  ];
  private conversations: GPTConversation[];
  private roomId: string;

  constructor(
    private ref: MatDialogRef<GPTConversationOverviewComponent>,
    private gptConversation: GPTConversationService,
    private appState: AppStateService,
  ) {}

  static open(dialog: MatDialog, roomId: string, id: string) {
    const ref = dialog.open(GPTConversationOverviewComponent);
    ref.componentInstance.roomId = roomId;
    ref.componentInstance.currentId = id;
    return ref;
  }

  ngOnInit(): void {
    this.gptConversation.getAllForUser().subscribe((data) => {
      this.conversations = data;
      data.sort(
        (a, b) =>
          (b.updatedAt || b.createdAt).getTime() -
          (a.updatedAt || a.createdAt).getTime(),
      );
      this.roomConversations = this.conversations.filter(
        (e) => e.roomId === this.roomId,
      );
      this.otherConversations = this.conversations.filter(
        (e) => e.roomId !== this.roomId,
      );
    });
  }

  submit(conversation: GPTConversation) {
    this.ref.close(conversation);
  }

  delete(event: MouseEvent, conversation: GPTConversation) {
    event.stopImmediatePropagation();
    this.gptConversation.delete(conversation.id).subscribe(() => {
      this.conversations = this.conversations.filter((e) => e !== conversation);
      if (conversation.roomId === this.roomId) {
        this.roomConversations = this.roomConversations.filter(
          (e) => e !== conversation,
        );
      } else {
        this.otherConversations = this.otherConversations.filter(
          (e) => e !== conversation,
        );
      }
    });
  }

  transformDate(conversation: GPTConversation) {
    const date = conversation.updatedAt || conversation.createdAt;
    return date.toLocaleString(this.appState.getCurrentLanguage());
  }

  transformLastMessage(conversation: GPTConversation) {
    const msg = conversation.messages[conversation.messages.length - 1];
    return msg ? this.shortenText(msg.content) : '';
  }

  transformFirstMessage(conversation: GPTConversation) {
    const msg = conversation.messages.find((e) => e.role === 'user');
    return msg ? this.shortenText(msg.content) : '';
  }

  private shortenText(str: string) {
    const bounds = 40;
    let index = str.indexOf('.');
    index = index < 0 ? str.length : index + 1 > bounds ? bounds : index + 1;
    return str.substring(0, index) + (index < str.length ? ' …' : '');
  }
}
