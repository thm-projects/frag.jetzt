import { Component, OnDestroy } from '@angular/core';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-introduction-room-list',
  templateUrl: './introduction-room-list.component.html',
  styleUrls: ['./introduction-room-list.component.scss'],
})
export class IntroductionRoomListComponent implements OnDestroy {
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
