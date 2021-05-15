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

  filterProfanityWords(str: string): string{
    let questionWithProfinity = str;

    // German Profanity
    this.badWords['de'].map(word =>{
      questionWithProfinity = questionWithProfinity.toLowerCase().includes(word) ?
      this.replaceString(questionWithProfinity.toLowerCase(), word, this.generateXWord(word.length))
      : questionWithProfinity;
    });

    // English Profanity
    this.badWords['en'].map(word =>{
      questionWithProfinity = questionWithProfinity.toLowerCase().includes(word) ?
      this.replaceString(questionWithProfinity.toLowerCase(), word, this.generateXWord(word.length))
      : questionWithProfinity;
    });

    // French Profanity
    this.badWords['fr'].map(word =>{
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
