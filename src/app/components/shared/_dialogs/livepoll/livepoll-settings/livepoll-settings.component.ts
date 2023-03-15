import { Component, Input, OnInit } from '@angular/core';
import { LivepollDialogComponent } from '../livepoll-dialog/livepoll-dialog.component';

@Component({
  selector: 'app-livepoll-settings',
  templateUrl: './livepoll-settings.component.html',
  styleUrls: [
    '../livepoll-dialog/livepoll-dialog.component.scss',
    './livepoll-settings.component.scss',
    '../livepoll-common.scss',
  ],
})
export class LivepollSettingsComponent {
  @Input() parent!: LivepollDialogComponent;
}
