import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-introduction-moderation',
  templateUrl: './introduction-moderation.component.html',
  styleUrls: ['./introduction-moderation.component.scss'],
})
export class IntroductionModerationComponent implements OnInit, OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<IntroductionModerationComponent>,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  onClose() {
    this.dialogRef.close();
  }
}
