import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatDialogRef } from '@angular/material/dialog';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { Language } from 'app/services/http/languagetool.service';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss'],
})
export class DataProtectionComponent implements OnInit, OnDestroy {
  confirmButtonType: DialogConfirmActionButtonType;
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<DataProtectionComponent>,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
    this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close(false);
  }

  buildConfirmActionCallback(): () => void {
    return () => this.dialogRef.close(true);
  }
}
