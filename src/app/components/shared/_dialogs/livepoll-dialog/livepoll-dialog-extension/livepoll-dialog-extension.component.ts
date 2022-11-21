import {Component, Input, OnInit} from '@angular/core';
import {LivepollDialogComponent} from '../livepoll-dialog.component';

@Component({
  selector: 'app-livepoll-dialog-extension',
  templateUrl: './livepoll-dialog-extension.component.html',
  styleUrls: ['./livepoll-dialog-extension.component.scss']
})
export class LivepollDialogExtensionComponent implements OnInit {

  @Input() parent: LivepollDialogComponent;

  constructor() {
  }

  ngOnInit(): void {
  }

  stop() {

  }
}

