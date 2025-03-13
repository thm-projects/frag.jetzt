import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { GPTRoomPresetTopic } from 'app/models/gpt-room-preset';

@Component({
  selector: 'app-gptpreset-topics-dialog',
  templateUrl: './gptpreset-topics-dialog.component.html',
  styleUrls: ['./gptpreset-topics-dialog.component.scss'],
  standalone: false,
})
export class GPTPresetTopicsDialogComponent implements OnInit {
  @Input()
  topics: GPTRoomPresetTopic[] = [];
  protected topicDescription: string = '';

  constructor() {}

  static open(dialog: MatDialog, topics: GPTRoomPresetTopic[]) {
    const ref = dialog.open(GPTPresetTopicsDialogComponent);
    ref.componentInstance.topics = topics;
    return ref;
  }

  ngOnInit(): void {
    this.topics.sort();
  }

  addTopic() {
    if (
      !this.topicDescription ||
      this.topics.findIndex((e) => e.description === this.topicDescription) > -1
    ) {
      return;
    }
    this.topics.push({
      description: this.topicDescription,
      active: true,
    });
    this.topics.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, {
        sensitivity: 'base',
      }),
    );
    this.topicDescription = '';
  }

  checkEnter(e: KeyboardEvent, func: () => void) {
    if (e.key === 'Enter') {
      func.bind(this)();
    }
  }

  onChange(change: MatSelectionListChange) {
    const changElem = change.options[0];
    const i = [...change.source.options].findIndex((e) => e === changElem);
    this.topics[i].active = changElem.selected;
  }
}
