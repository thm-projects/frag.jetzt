import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../state/app-state.service';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private _attachment: string = null;

  constructor(
    private translateService: TranslateService,
    private appState: AppStateService,
  ) {
    this.appState.language$.subscribe(() => {
      this.updateTitle();
    });
  }

  resetTitle() {
    this._attachment = null;
    this.updateTitle();
  }

  attachTitle(str: string) {
    this._attachment = str;
    this.updateTitle();
  }

  private updateTitle() {
    const key = this._attachment ? 'title.attach-title' : 'title.default-title';
    this.translateService
      .get(key, { attachment: this._attachment })
      .subscribe((msg) => {
        document.title = msg;
      });
  }
}
