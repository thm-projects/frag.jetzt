import { Component, Input } from '@angular/core';
import { LivepollDialogComponent } from '../livepoll-dialog/livepoll-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  MarkdownEditorDialogComponent,
  MarkdownEditorDialogData,
} from '../../../utility/markdown-editor-dialog/markdown-editor-dialog.component';

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

  constructor(public readonly dialog: MatDialog) {}

  openMarkdownEditor() {
    const dialog = this.dialog.open(MarkdownEditorDialogComponent, {
      width: '500px',
      data: {
        data: this.parent.livepollSession.title || '',
      } as MarkdownEditorDialogData,
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.parent.livepollSession.title = result;
      }
    });
  }
}
