import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Language } from 'app/services/http/languagetool.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-introduction-comment-list',
  templateUrl: './introduction-comment-list.component.html',
  styleUrls: ['./introduction-comment-list.component.scss'],
})
export class IntroductionCommentListComponent implements OnInit, OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<IntroductionCommentListComponent>,
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
