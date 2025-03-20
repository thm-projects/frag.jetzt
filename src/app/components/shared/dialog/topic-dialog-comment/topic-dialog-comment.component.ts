import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss'],
  standalone: false,
})
export class TopicDialogCommentComponent implements OnInit {
  @Input() question: string;
  @Input() keyword: string;
  @Input() maxShowedCharachters: number;
  @Input() languageSpecific;
  @Input() partialWords;
  questionText: string;

  isCollapsed = false;

  public badWords = [];

  public parts: string[];
  public partsShort: string[];

  constructor() {}

  get partsOfQuestion() {
    return this.parts;
  }

  get partsOfShortQuestion() {
    return this.partsShort;
  }

  splitShortQuestion(question: string) {
    return question.slice(0, this.maxShowedCharachters).split(this.keyword);
  }

  splitQuestion(question: string) {
    return question.split(this.keyword);
  }

  ngOnInit(): void {
    this.questionText = this.question;
    this.parts = this.splitQuestion(this.questionText);
    this.partsShort = this.splitShortQuestion(this.questionText);
  }
}
