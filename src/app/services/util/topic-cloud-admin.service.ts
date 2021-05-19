import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseHttpService } from '../http/base-http.service';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class TopicCloudAdminService extends BaseHttpService{

  constructor(private http: HttpClient) {
    super();
    this.badWords = BadWords;
    this.badWords['custom'] = [];
  }

  private badWords = [];

  get getBadWordList(): string[]{
    return this.badWords['custom'];
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;
    // TODO: another languages
    /* put all arrays of languages together */
    const profanityWords = this.badWords['en'].concat(this.badWords['de'])
                           .concat(this.badWords['fr']).concat(this.badWords['custom']);
    profanityWords.map(word =>{
      questionWithProfanity = questionWithProfanity.toLowerCase().includes(word.toLowerCase()) ?
      this.replaceString(questionWithProfanity.toLowerCase(), word.toLowerCase(), this.generateXWord(word.length))
      : questionWithProfanity;
    });
    return questionWithProfanity;
  }

  addToBadwordList(word: string){
    if (word !== undefined) {
      this.badWords['custom'].push(word);
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