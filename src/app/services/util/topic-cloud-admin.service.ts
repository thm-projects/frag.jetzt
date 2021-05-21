import { stringify } from '@angular/compiler/src/util';
import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private badWords = [];
  private profanityWords = [];
  private blacklist = []; // should be stored in backend
  private profanityKey = 'custom-Profanity-List';

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
          this.generateCensoredWord(word.length)
        )
        : questionWithProfanity;
    });
    return questionWithProfanity;
  }

  getBadWordList(): string[] {
    const list = localStorage.getItem(this.profanityKey);
    return list ? list.split(',') : [];
  }

  addToBadWordList(word: string) {
    if (word !== undefined) {
      const newList = this.getBadWordList();
      if (newList.includes(word)){
        return;
      }
      newList.push(word);
      localStorage.setItem(this.profanityKey, newList.toString());
    }
  }

  removeFromBadWordList(badword: string) {
    const list = this.getBadWordList();
    list.map(word => {
      if (word === badword){
        list.splice(list.indexOf(word, 0), 1);
      }
    });
    localStorage.setItem(this.profanityKey, list.toString());
  }

  removeBadwordList(){
    localStorage.removeItem(this.profanityKey);
  }

  getBlacklistWordList(): string[] {
    return this.blacklist;
  }

  addToBlacklistWordList(word: string) {
    if (word !== undefined) {
      this.blacklist.push(word);
    }
  }

  removeWordFromBlacklist(word: string) {
    this.blacklist.splice(this.blacklist.indexOf(word), 1);
  }


  private replaceString(str: string, search: string, replace: string) {
    return str.split(search).join(replace);
  }

  private generateCensoredWord(count: number) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res += '*';
    }
    return res;
  }
}
