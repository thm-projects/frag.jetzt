import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalCountChanged } from 'app/models/global-count-changed';
import { SessionService } from 'app/services/util/session.service';
import { StatusInfoComponent } from '../_dialogs/status-info/status-info.component';
import { ReplaySubject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-global-status-indicator',
  templateUrl: './global-status-indicator.component.html',
  styleUrls: ['./global-status-indicator.component.scss'],
})
export class GlobalStatusIndicatorComponent implements OnInit, OnDestroy {
  status: GlobalCountChanged = null;
  protected class: 'high' | 'medium' | 'low' = 'low';
  private openDialog: StatusInfoComponent = null;
  private destroyer = new ReplaySubject(1);

  constructor(
    private sessionService: SessionService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.sessionService
      .getGlobalData()
      .pipe(takeUntil(this.destroyer))
      .subscribe(this.onStatusUpdate.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  protected openInfo(event: MouseEvent) {
    event.stopImmediatePropagation();
    if (this.status != null) {
      this.openDialog = StatusInfoComponent.open(
        this.dialog,
        this.status,
      ).componentInstance;
    }
  }

  private onStatusUpdate(data: GlobalCountChanged) {
    if (!data) {
      return;
    }
    this.status = data;
    if (this.status.sessionCount > 200 || this.status.activeRoomCount > 50) {
      this.class = 'high';
    } else if (this.status.sessionCount > 50) {
      this.class = 'medium';
    } else {
      this.class = 'low';
    }
    if (this.openDialog != null) {
      this.openDialog.updateStatus(this.status);
    }
  }
}
