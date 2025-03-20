import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { Room } from 'app/models/room';
import { SimpleAIService } from 'app/room/assistant-route/services/simple-ai.service';
import { NotificationService } from 'app/services/util/notification.service';
import { UUID } from 'app/utils/ts-utils';
import { Subject, finalize, takeUntil } from 'rxjs';

interface SelectableIdea {
  text: string;
  selected: boolean;
}

@Component({
  selector: 'app-chat-gptbrainstorm',
  templateUrl: './chat-gptbrainstorm.component.html',
  styleUrls: ['./chat-gptbrainstorm.component.scss'],
  standalone: false,
})
export class ChatGPTBrainstormComponent {
  isSending = false;
  elements: SelectableIdea[] = [];
  private data: BrainstormingSession;
  private roomId: UUID;
  private stopper = new Subject<boolean>();

  constructor(
    private dialogRef: MatDialogRef<ChatGPTBrainstormComponent>,
    private notification: NotificationService,
    private simpleAIService: SimpleAIService,
  ) {}

  static open(dialog: MatDialog, room: Room) {
    const ref = dialog.open(ChatGPTBrainstormComponent);
    ref.componentInstance.data = room.brainstormingSession;
    ref.componentInstance.roomId = room.id;
    return ref;
  }

  generate(value: string) {
    this.isSending = true;
    this.simpleAIService
      .createBrainstormingIdeas(
        this.data.title,
        Number(value),
        this.data.maxWordCount,
        this.data.maxWordLength,
      )
      .pipe(
        takeUntil(this.stopper),
        finalize(() => {
          this.isSending = false;
        }),
      )
      .subscribe({
        next: (ideas) => {
          this.elements = ideas.map((idea) => ({
            text: idea,
            selected: true,
          }));
        },
        error: (e) => {
          let errorMessage = e.message ? e.message : e;
          if (e instanceof HttpErrorResponse) {
            const data = JSON.parse(e.error || null);
            errorMessage = data?.message ? data.message : errorMessage;
          }
          this.notification.show(errorMessage, undefined, {
            duration: 12_500,
            panelClass: ['snackbar-invalid'],
          });
        },
      });
  }

  protected confirm() {
    this.dialogRef.close(
      this.elements.filter((e) => e.selected).map((e) => e.text),
    );
  }
}
