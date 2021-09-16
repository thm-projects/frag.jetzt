import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import * as BadWords from 'naughty-words';

@Injectable({
  providedIn: 'root'
})
export class ProfanityFilterService {

  private customProfanityWords: Subject<string[]>;
  private readonly profanityKey = 'custom-Profanity-List';
  private profanityWords = [];

  constructor() {
    this.customProfanityWords = new Subject<string[]>();
    const badNL = BadWords['nl'];
    badNL.splice(badNL.indexOf('nicht'), 1);
    const badDE = BadWords['de'];
    badDE.splice(badDE.indexOf('ische'), 1);
    this.profanityWords = BadWords['en']
      .concat(badDE)
      .concat(BadWords['fr'])
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['es'])
      .concat(BadWords['it'])
      .concat(badNL)
      .concat(BadWords['pt'])
      .concat(BadWords['tr']);
  }

  get getProfanityList(): string[] {
    return this.getProfanityListFromStorage().concat(this.profanityWords);
  }

  getProfanityListFromStorage() {
    const list = localStorage.getItem(this.profanityKey);
    return list ? JSON.parse(list) : [];
  }

  getCustomProfanityList(): Observable<string[]> {
    this.customProfanityWords.next(this.getProfanityListFromStorage());
    return this.customProfanityWords.asObservable();
  }

  addToProfanityList(word: string) {
    if (word !== undefined) {
      const plist = this.getProfanityListFromStorage();
      if (!plist.includes(word.toLowerCase().trim())) {
        plist.push(word.toLowerCase().trim());
        localStorage.setItem(this.profanityKey, JSON.stringify(plist));
        this.customProfanityWords.next(plist);
      }
    }
  }

  removeFromProfanityList(word: string) {
    const plist = this.getProfanityListFromStorage();
    plist.splice(plist.indexOf(word, 0), 1);
    localStorage.setItem(this.profanityKey, JSON.stringify(plist));
    this.customProfanityWords.next(plist);
  }

  removeProfanityList() {
    localStorage.removeItem(this.profanityKey);
  }

  filterProfanityWords(str: string, censorPartialWordsCheck: boolean, censorLanguageSpecificCheck: boolean, lang?: string){
    let filteredString = str;
    let profWords = [];
    if (censorLanguageSpecificCheck) {
      profWords = BadWords[(lang !== 'AUTO' ? lang.toLowerCase() : localStorage.getItem('currentLang'))];
    } else {
      profWords = this.profanityWords;
    }
    str = str.replace(new RegExp(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi), '');
    // eslint-disable-next-line max-len
    const toCensoredString = censorPartialWordsCheck ? str.toLowerCase() : str.toLowerCase().split(/[\s,.]+/);
    profWords.concat(this.getProfanityListFromStorage()).forEach(word => {
      if (toCensoredString.includes(word)) {
        filteredString = this.replaceString(filteredString, word, this.generateCensoredWord(word.length));
      }
    });
    return filteredString;
  }

  private replaceString(str: string, search: string, replace: string) {
    return str.replace(new RegExp(search, 'gi'), replace);
  }

  private generateCensoredWord(count: number) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res += '*';
    }
    return res;
  }
}
