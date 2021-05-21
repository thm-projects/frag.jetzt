import { stringify } from '@angular/compiler/src/util';
import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private badWords = [];
  private profanityWords = [];
  private irrelevantWords = []; // should be stored in backend
  private blacklistKey = 'custom-Profanity-List';

  constructor() {
    this.badWords = BadWords;
    /* put all arrays of languages together */
    this.profanityWords = this.badWords['en']
      .concat(this.badWords['de'])
      .concat(this.badWords['fr'])
      .concat(this.badWords['ar'])
      .concat(this.badWords['tr']);
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;
    this.profanityWords.concat(this.getBadWordList()).map((word) => {
      questionWithProfanity = questionWithProfanity
        .toLowerCase()
        .includes(word.toLowerCase())
        ? this.replaceString(
          questionWithProfanity.toLowerCase(),
          word.toLowerCase(),
          this.generateXWord(word.length)
        )
        : questionWithProfanity;
    });
    return questionWithProfanity;
  }

  getBadWordList(): string[] {
    const list = localStorage.getItem(this.blacklistKey);
    return list ? list.split(',') : [];
  }

  addToBadWordList(word: string) {
    if (word !== undefined) {
      const newList = this.getBadWordList();
      if (newList.includes(word)){
        return;
      }
      newList.push(word);
      localStorage.setItem(this.blacklistKey, newList.toString());
    }
  }

  removeFromBadWordList(badword: string) {
    const list = this.getBadWordList();
    list.map(word => {
      if (word === badword){
        list.splice(list.indexOf(word, 0), 1);
      }
    });
    localStorage.setItem(this.blacklistKey, list.toString());
  }

  removeBadwordList(){
    localStorage.removeItem(this.blacklistKey);
  }

  getIrrelevantWordList(): string[] {
    return this.irrelevantWords;
  }

  addToIrrelevantwordList(word: string) {
    if (word !== undefined) {
      this.irrelevantWords.push(word);
    }
  }

  removeFromIrrelevantWordList(irrelevantWord: string) {
    this.irrelevantWords.splice(this.irrelevantWords.indexOf(irrelevantWord), 1);
  }


  private replaceString(str: string, search: string, replace: string) {
    return str.split(search).join(replace);
  }

  private generateXWord(count: number) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res += '*';
    }
    return res;
  }
}
