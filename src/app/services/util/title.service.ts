import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  static DEFAULT_TITLE = 'frag.jetzt';

  constructor() { }

  setTitle(title: string) {
    document.title = title;
  }

  resetTitle() {
    this.setTitle(TitleService.DEFAULT_TITLE);
  }

  attachTitle(str: string) {
    this.setTitle(TitleService.DEFAULT_TITLE + ' ' + str);
  }

}
