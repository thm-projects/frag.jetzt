import { Component, Input, OnDestroy } from '@angular/core';
import { LivepollDialogComponent } from '../livepoll-dialog/livepoll-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  MarkdownEditorDialogComponent,
  MarkdownEditorDialogData,
} from '../../../utility/markdown/markdown-editor-dialog/markdown-editor-dialog.component';
import { ReplaySubject, takeUntil } from 'rxjs';
import { DeviceStateService } from 'app/services/state/device-state.service';

@Component({
  selector: 'app-livepoll-settings',
  templateUrl: './livepoll-settings.component.html',
  styleUrls: [
    '../livepoll-dialog/livepoll-dialog.component.scss',
    './livepoll-settings.component.scss',
    '../livepoll-common.scss',
  ],
  standalone: false,
})
export class LivepollSettingsComponent implements OnDestroy {
  @Input() parent!: LivepollDialogComponent;
  isMobile = false;
  private destroyer = new ReplaySubject(1);

  constructor(
    public readonly dialog: MatDialog,
    deviceState: DeviceStateService,
  ) {
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  openMarkdownEditor() {
    const dialog = this.dialog.open(MarkdownEditorDialogComponent, {
      width: '500px',
      disableClose: true,
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
