import { stringify } from '@angular/compiler/src/util';
import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';
// eslint-disable-next-line max-len
import { TopicCloudAdminData, KeywordOrFulltext } from '../../../app/components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private profanityWords = [];
  private blacklist = []; // should be stored in backend
  private readonly profanityKey = 'custom-Profanity-List';
  private readonly adminKey = 'Topic-Cloud-Admin-Data';

  constructor() {
    /* put all arrays of languages together */
    this.profanityWords = BadWords['en']
      .concat(BadWords['de'])
      .concat(BadWords['fr'])
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['tr']);
  }

  getBlacklistWords(profanityFilter: boolean, blacklistFilter: boolean) {
    let words = [];
    if (profanityFilter) {
      // TODO: send only words that are contained in keywords
      words = words.concat(this.profanityWords).concat(this.getProfanityList());
    }
    if (blacklistFilter && this.blacklist.length > 0) {
        words = words.concat(this.blacklist);
    }
    return words;
  }

  get getAdminData(): TopicCloudAdminData {
    let data = JSON.parse(localStorage.getItem(this.adminKey));
    if (!data) {
      data = {
        blacklist: this.profanityWords,
        wantedLabels: [],
        considerVotes: false,
        profanityFilter: true,
        blacklistIsActive: false,
        keywordORfulltext: KeywordOrFulltext.keyword
      };
    }
    return data;
  }

  setAdminData(adminData: TopicCloudAdminData){
    localStorage.setItem(this.adminKey, JSON.stringify(adminData));
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;
    this.profanityWords.concat(this.getProfanityList()).map((word) => {
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

  getProfanityList(): string[] {
    const list = localStorage.getItem(this.profanityKey);
    return list ? list.split(',') : [];
  }

  addToProfanityList(word: string) {
    if (word !== undefined) {
      const newList = this.getProfanityList();
      if (newList.includes(word)){
        return;
      }
      newList.push(word);
      localStorage.setItem(this.profanityKey, newList.toString());
    }
  }

  removeFromProfanityList(profanityWord: string) {
    const list = this.getProfanityList();
    list.map(word => {
      if (word === profanityWord){
        list.splice(list.indexOf(word, 0), 1);
      }
    });
    localStorage.setItem(this.profanityKey, list.toString());
  }

  removeProfanityList(){
    localStorage.removeItem(this.profanityKey);
  }

  getBlacklist(): string[] {
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
