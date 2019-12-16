import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DialogEvent } from '../DialogEvent';

@Component({
  selector: 'ars-dialog-box-content',
  templateUrl: './dialog-box-content.component.html',
  styleUrls: ['./dialog-box-content.component.scss']
})
export class DialogBoxContentComponent implements OnInit, DialogEvent {

  @Output() closeEmit: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit() {
  }

}
