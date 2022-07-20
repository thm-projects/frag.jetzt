import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {LivePollEntry} from './LivePollEntry';

@Component({
  selector: 'app-live-poll-entry',
  templateUrl: './live-poll-entry.component.html',
  styleUrls: ['../live-poll.component.scss']
})
export class LivePollEntryComponent implements OnInit {

  @Input() value: LivePollEntry;

  constructor(
    public ref: ElementRef
  ) {
  }

  ngOnInit(): void {
  }

}
