import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';


@Injectable({
  providedIn: 'root'
})
export class TopicCloudAdminService {

  private badWords = [];

  get getBadWordList(): string[]{
    return this.badWords;
  }

  constructor() {
    this.badWords = BadWords;
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;

    // German Profanity
    this.badWords['de'].map(word =>{
      questionWithProfanity = questionWithProfanity.toLowerCase().includes(word) ?
      this.replaceString(questionWithProfanity.toLowerCase(), word, this.generateXWord(word.length))
      : questionWithProfanity;
    });

    // English Profanity
    this.badWords['en'].map(word =>{
      questionWithProfanity = questionWithProfanity.toLowerCase().includes(word) ?
      this.replaceString(questionWithProfanity.toLowerCase(), word, this.generateXWord(word.length))
      : questionWithProfanity;
    });

    // French Profanity
    this.badWords['fr'].map(word =>{
      questionWithProfanity = questionWithProfanity.toLowerCase().includes(word) ?
      this.replaceString(questionWithProfanity.toLowerCase(), word, this.generateXWord(word.length))
      : questionWithProfanity;
    });

    return questionWithProfanity;
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
