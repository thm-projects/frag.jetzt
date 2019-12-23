import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { DialogEvent } from '../../../../../../projects/ars/src/lib/components/content/dialog/DialogEvent';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit, DialogEvent {
  @Output() closeEmit: EventEmitter<void> = new EventEmitter<void>();
  deviceType: string;
  currentLang: string;

  constructor(private dialogRef: MatDialogRef<ImprintComponent>) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }
}
