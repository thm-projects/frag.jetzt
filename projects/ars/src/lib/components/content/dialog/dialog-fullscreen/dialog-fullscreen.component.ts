import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DialogEvent } from '../DialogEvent';

@Component({
  selector: 'ars-dialog-fullscreen',
  templateUrl: './dialog-fullscreen.component.html',
  styleUrls: ['./dialog-fullscreen.component.scss']
})
export class DialogFullscreenComponent implements OnInit, DialogEvent {

  @Output() closeEmit: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit() {
  }

}
