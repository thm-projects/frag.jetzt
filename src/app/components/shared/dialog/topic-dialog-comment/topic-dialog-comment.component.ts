import { Component, Input, OnInit } from '@angular/core';
import { HighlightPipe } from './highlight.pipe';
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

  public shortQuestion: string;

  constructor() { }

  get partsOfQuestion() {
    // return this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters).split(new RegExp(this.keyword,'i'));

    let q = this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters);
    // let q2 = q.split(new RegExp('(' + this.keyword + ')', 'i'));
    let q2 = q.split(' ');
    return q2;
  }

  ngOnInit(): void {
    this.badWords = BadWordsList.array;

    // if (this.question.length > this.maxShowedCharachters) {
    //   this.shortQuestion = this.question.slice(0, this.maxShowedCharachters).concat('...');
    // } else {
    //   this.shortQuestion = this.question;
    // }
  }
}
