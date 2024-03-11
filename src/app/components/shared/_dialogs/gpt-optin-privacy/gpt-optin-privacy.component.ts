import { Component, OnDestroy } from '@angular/core';
import {
  AppStateService,
  Language,
} from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gpt-optin-privacy',
  templateUrl: './gpt-optin-privacy.component.html',
  styleUrls: ['./gpt-optin-privacy.component.scss'],
})
export class GptOptInPrivacyComponent implements OnDestroy {
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(appState: AppStateService) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }
}
