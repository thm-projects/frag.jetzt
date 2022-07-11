import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as BadWords from 'naughty-words';
import { escapeForRegex } from '../../utils/regex-escape';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class ProfanityFilterService {

  private customProfanityWords: BehaviorSubject<string[]>;
  private readonly profanityKey = 'custom-Profanity-List';
  private readonly _profanityWords: string[];

  constructor(
    private languageService: LanguageService,
  ) {
    const badNL = BadWords['nl'];
    badNL.splice(badNL.indexOf('nicht'), 1);
    const badDE = BadWords['de'];
    badDE.splice(badDE.indexOf('ische'), 1);
    const badEN = BadWords['en'];
    const badFR = BadWords['fr'];
    badFR.splice(badFR.indexOf('bitte'), 1);
    const badTR = BadWords['tr'];
    badTR.splice(badTR.indexOf('am'), 1);
    this._profanityWords = badEN
      .concat(badDE)
      .concat(badFR)
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['es'])
      .concat(BadWords['it'])
      .concat(badNL)
      .concat(BadWords['pt'])
      .concat(badTR);
    this.customProfanityWords = new BehaviorSubject<string[]>(this.createProfanityList());
  }

  get getProfanityList(): string[] {
    return this.customProfanityWords.value;
  }

  getProfanityListFromStorage() {
    const list = localStorage.getItem(this.profanityKey);
    return list ? JSON.parse(list) : [];
  }

  getCustomProfanityList(): Observable<string[]> {
    return this.customProfanityWords.asObservable();
  }

  addToProfanityList(word: string) {
    if (!word) {
      return;
    }
    word = word.trim().toLowerCase();
    if (!word) {
      return;
    }
    const plist = this.getProfanityListFromStorage();
    if (plist.includes(word)) {
      return;
    }
    plist.push(word);
    localStorage.setItem(this.profanityKey, JSON.stringify(plist));
    this.customProfanityWords.next(this.createProfanityList());
  }

  removeFromProfanityList(word: string) {
    if (!word) {
      return;
    }
    word = word.trim().toLowerCase();
    if (!word) {
      return;
    }
    const plist = this.getProfanityListFromStorage();
    const index = plist.indexOf(word);
    if (index < 0) {
      return;
    }
    plist.splice(index, 1);
    localStorage.setItem(this.profanityKey, JSON.stringify(plist));
    this.customProfanityWords.next(this.createProfanityList());
  }

  removeProfanityList() {
    localStorage.removeItem(this.profanityKey);
  }

  filterProfanityWords(
    str: string,
    censorPartialWordsCheck: boolean,
    censorLanguageSpecificCheck: boolean,
    lang?: string
  ): [string, boolean] {
    let profWords: any[];
    if (censorLanguageSpecificCheck) {
      profWords = BadWords[(lang !== 'AUTO' ? lang.toLowerCase() : this.languageService.currentLanguage())];
    } else {
      profWords = this.getProfanityList;
    }
    const list = profWords;
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

  private createProfanityList() {
    return this.getProfanityListFromStorage().concat(this._profanityWords);
  }
}
