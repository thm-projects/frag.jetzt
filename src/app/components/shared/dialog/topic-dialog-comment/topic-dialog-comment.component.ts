import { Component, Input, OnInit } from '@angular/core';
import * as BadWordsList from 'badwords-list/lib/index.js';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss']
})
export class TopicDialogCommentComponent implements OnInit {

  @Input() question: string;
  @Input() keyword: string ;
  @Input() maxShowedCharachters: number;
  @Input() isCollapsed = false;
  @Input() profanityFilter = true;
  public badWords = [];
  questionWithProfinity: string = undefined;

  public shortQuestion: string;

  constructor() { }

  get partsOfQuestion() {    
    const q = this.profanityFilter ? this.questionWithProfinity.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters) :
              this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters);
    const q2 = q.split(' ');
    return q2;
  }

  ngOnInit(): void {
    this.badWords = BadWordsList.array;
    this.filterProfanityWords();
  }
  
  filterProfanityWords(){
    this.questionWithProfinity = this.question;
      this.badWords.map(word =>{
        this.questionWithProfinity = this.questionWithProfinity.toLowerCase().includes(word) ?
        this.replaceString(this.questionWithProfinity.toLowerCase(), word, this.generateXWord(word.length))
        : this.questionWithProfinity;
      });
  }

  replaceString(str: string, search: string, replace: string){
    return str.split(search).join(replace);
  }

  generateXWord(count: number){
    let res = '';
    for (let i = 0; i < count; i++){
      res += '*';
    }
    return res;
  }
}
