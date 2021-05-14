import { Injectable } from '@angular/core';
import * as BadWordsList from 'badwords-list/lib/index.js';

@Injectable({
  providedIn: 'root'
})
export class TopicCloudAdminService {

  private badWords: string[] = [];

  get getBadWordList(): string[]{
    return this.badWords;
  }

  constructor() {
    this.badWords = BadWordsList.array;
  }

  filterProfanityWords(str: string): string{
    let questionWithProfinity = str;
      this.badWords.map(word =>{
        questionWithProfinity = questionWithProfinity.toLowerCase().includes(word) ?
        this.replaceString(questionWithProfinity.toLowerCase(), word, this.generateXWord(word.length))
        : questionWithProfinity;
      });
      return questionWithProfinity;
    }

  addToBadwordList(word: string){
    if (word !== undefined) {
      this.badWords.push(word);
    }
  }

  private replaceString(str: string, search: string, replace: string){
    return str.split(search).join(replace);
  }

  private generateXWord(count: number){
    let res = '';
    for (let i = 0; i < count; i++){
      res += '*';
    }
    return res;
  }
}
