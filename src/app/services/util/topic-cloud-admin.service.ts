import { stringify } from '@angular/compiler/src/util';
import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private badWords = [];
  private profanityWords = [];
  private irrelevantWords = [];
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
    this.profanityWords.concat(this.getBadwordList()).map((word) => {
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

  getBadwordList(): string[]{
    const list = localStorage.getItem(this.blacklistKey);
    return list ? list.split(',') : [];
  }

  addToBadwordList(word: string) {
    if (word !== undefined) {
      const newList = this.getBadwordList();
      if (newList.includes(word)){
        return;
      }
      newList.push(word);
      localStorage.setItem(this.blacklistKey, newList.toString());
    }
  }

  removeFromBadwordList(badword: string){
    const list = this.getBadwordList();
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

  addToIrrelevantwordList(word: string) {
    if (word !== undefined) {
      this.irrelevantWords.push(word);
    }
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
