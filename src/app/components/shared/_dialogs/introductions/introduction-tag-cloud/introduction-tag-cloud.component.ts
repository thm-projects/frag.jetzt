import { Component, OnDestroy } from '@angular/core';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-introduction-tag-cloud',
  templateUrl: './introduction-tag-cloud.component.html',
  styleUrls: ['./introduction-tag-cloud.component.scss'],
  standalone: false,
})
export class IntroductionTagCloudComponent implements OnDestroy {
  currentLanguage: Language;
  protected isPle: boolean = false;
  private destroyer = new ReplaySubject(1);

  constructor(roomState: RoomStateService, appState: AppStateService) {
    roomState.room$.pipe(takeUntil(this.destroyer)).subscribe((room) => {
      this.isPle = room?.mode === 'PLE';
    });
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }
}
