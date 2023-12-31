import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { Room } from 'app/models/room';
import { GptService } from 'app/services/http/gpt.service';
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
})
export class ChatGPTBrainstormComponent implements OnInit {
  onCancel = this.abort.bind(this);
  onConfirm = this.confirm.bind(this);
  isSending = false;
  elements: SelectableIdea[] = [];
  private data: BrainstormingSession;
  private msg: string = '';
  private lastIndex = 0;
  private roomId: UUID;
  private stopper = new Subject<boolean>();

  constructor(
    private dialogRef: MatDialogRef<ChatGPTBrainstormComponent>,
    private gpt: GptService,
    private translate: TranslateService,
    private notification: NotificationService,
  ) {}

  static open(dialog: MatDialog, room: Room) {
    const ref = dialog.open(ChatGPTBrainstormComponent);
    ref.componentInstance.data = room.brainstormingSession;
    ref.componentInstance.roomId = room.id;
    return ref;
  }

  ngOnInit(): void {}

  generate(value: string) {
    this.translate
      .get(['chatgpt-brainstorm.prompt-preset', 'chatgpt-brainstorm.prompt'], {
        count: value,
        topic: this.data.title,
        wordCount: this.data.maxWordCount,
        charCount: this.data.maxWordLength,
      })
      .subscribe((msgs) => {
        const preset = msgs['chatgpt-brainstorm.prompt-preset'];
        const prompt = msgs['chatgpt-brainstorm.prompt'];
        this.isSending = true;
        this.msg = '';
        this.elements.length = 0;
        this.lastIndex = 0;
        this.gpt
          .requestChatStream({
            messages: [
              {
                role: 'system',
                content: preset,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            model: 'gpt-3.5-turbo-1106',
            temperature: 1.0,
            roomId: this.roomId,
          })
          .pipe(
            takeUntil(this.stopper),
            finalize(() => {
              this.isSending = false;
            }),
          )
          .subscribe({
            next: (v) => {
              if (!('choices' in v)) {
                if (v.done) {
                  this.makeElements(true);
                }
                return;
              }
              this.msg += v.choices[0].delta.content || '';
              this.makeElements(Boolean(v.choices[0].finishReason));
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
      });
  }

  private makeElements(finished: boolean) {
    const regex = finished
      ? /\s*(?:\d+\.|-)\s([^\n]*)(?:\n|$)/gm
      : /\s*(?:\d+\.|-)\s([^\n]*)\n/gm;
    regex.lastIndex = this.lastIndex;
    let m: RegExpMatchArray;
    while ((m = regex.exec(this.msg)) !== null) {
      this.elements.push({
        text: m[1],
        selected: true,
      });
      this.lastIndex = m.index + m[0].length;
    }
  }

  private abort() {
    this.dialogRef.close();
  }

  private confirm() {
    this.dialogRef.close(
      this.elements.filter((e) => e.selected).map((e) => e.text),
    );
  }
}
