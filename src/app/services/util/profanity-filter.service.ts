import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import * as BadWords from 'naughty-words';
import { escapeForRegex } from '../../utils/regex-escape';

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
    const badEN = BadWords['en'];
    const badFr = BadWords['fr'];
    badFr.splice(badFr.indexOf('bitte'), 1);
    this.profanityWords = badEN
      .concat(badDE)
      .concat(badFr)
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

  filterProfanityWords(str: string,
                       censorPartialWordsCheck: boolean,
                       censorLanguageSpecificCheck: boolean,
                       lang?: string): [string, boolean] {
    let profWords: any[];
    if (censorLanguageSpecificCheck) {
      profWords = BadWords[(lang !== 'AUTO' ? lang.toLowerCase() : localStorage.getItem('currentLang'))];
    } else {
      profWords = this.profanityWords;
    }
    const list = profWords.concat(this.getProfanityListFromStorage());
    if (list.length < 1 || !str) {
      return [str, false];
    }
    const censoredWords = list.reduce((acc, elem) => acc + (acc.length > 1 ? '|' : '') + escapeForRegex(elem), '(') + ')';
    const regex = new RegExp(censorPartialWordsCheck ? censoredWords : '\\b' + censoredWords + '\\b', 'gmi');
    let result = '';
    let censored = false;
    let m: RegExpExecArray;
    let lastIndex = 0;
    while ((m = regex.exec(str)) !== null) {
      result += str.substring(lastIndex, m.index) + '★'.repeat(regex.lastIndex - m.index);
      lastIndex = regex.lastIndex;
      censored = true;
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    result += str.substring(lastIndex);
    return [result, censored];
  }
}
