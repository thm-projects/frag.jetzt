import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  private _attachment: any = null;

  constructor(
    private httpClient: HttpClient,
    private translateService: TranslateService,
    private languageService: LanguageService,
  ) {
    this.languageService.getLanguage().subscribe(_ => {
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
    this.translateService.get(key, { attachment: this._attachment }).subscribe(msg => {
      document.title = msg;
    });
  }

}
