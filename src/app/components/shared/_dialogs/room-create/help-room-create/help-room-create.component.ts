import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-help-room-create',
  templateUrl: './help-room-create.component.html',
  styleUrls: ['./help-room-create.component.scss'],
  standalone: false,
})
export class HelpRoomCreateComponent implements OnInit, OnDestroy {
  language: string;
  readonly onClose = this.close.bind(this);
  private destroyer = new ReplaySubject<void>();

  constructor(
    private appState: AppStateService,
    private dialogRef: MatDialogRef<HelpRoomCreateComponent>,
  ) {}

  ngOnInit(): void {
    this.appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((language) => {
        this.language = language;
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
  }

  private close() {
    this.dialogRef.close();
  }
}
