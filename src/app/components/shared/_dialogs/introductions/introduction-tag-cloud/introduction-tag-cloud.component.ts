import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-introduction-tag-cloud',
  templateUrl: './introduction-tag-cloud.component.html',
  styleUrls: ['./introduction-tag-cloud.component.scss'],
})
export class IntroductionTagCloudComponent implements OnInit, OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<IntroductionTagCloudComponent>,
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
