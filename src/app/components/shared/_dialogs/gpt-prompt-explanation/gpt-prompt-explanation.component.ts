import { Component, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gpt-prompt-explanation',
  templateUrl: './gpt-prompt-explanation.component.html',
  styleUrls: ['./gpt-prompt-explanation.component.scss'],
  standalone: false,
})
export class GptPromptExplanationComponent implements OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<GptPromptExplanationComponent>,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }
}
