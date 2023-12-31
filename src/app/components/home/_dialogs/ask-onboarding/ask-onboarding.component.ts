import { Component, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AppStateService,
  Language,
} from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-ask-onboarding',
  templateUrl: './ask-onboarding.component.html',
  styleUrls: ['./ask-onboarding.component.scss'],
})
export class AskOnboardingComponent implements OnDestroy {
  public readonly onSubmit = this.submit.bind(this);
  public readonly onCancel = this.cancel.bind(this);
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    appState: AppStateService,
    private dialogRef: MatDialogRef<AskOnboardingComponent>,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  private submit() {
    this.dialogRef.close(true);
  }

  private cancel() {
    this.dialogRef.close(false);
  }
}
