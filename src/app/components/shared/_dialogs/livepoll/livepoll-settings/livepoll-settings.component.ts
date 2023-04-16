import { Component, Input } from '@angular/core';
import { LivepollDialogComponent } from '../livepoll-dialog/livepoll-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  MarkdownEditorDialogComponent,
  MarkdownEditorDialogData,
} from '../../../utility/markdown/markdown-editor-dialog/markdown-editor-dialog.component';
import { DeviceInfoService } from '../../../../../services/util/device-info.service';

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

  constructor(
    public readonly dialog: MatDialog,
    public readonly device: DeviceInfoService,
  ) {}

  openMarkdownEditor() {
    const dialog = this.dialog.open(MarkdownEditorDialogComponent, {
      width: '500px',
      data: {
        data: this.parent.livepollSession.title || '',
        useTemplate: true,
      } as MarkdownEditorDialogData,
    });
    dialog.afterClosed().subscribe((result) => {
      if (typeof result === 'string') {
        this.parent.livepollSession.title = result;
      }
    });
  }
}
