import { Component, Input, OnInit } from '@angular/core';
import { Language } from '../../../../models/comment';
import { ProfanityFilterService } from '../../../../services/util/profanity-filter.service';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss']
})
export class TopicDialogCommentComponent implements OnInit {

  @Input() question: string;
  @Input() language: Language;
  @Input() keyword: string ;
  @Input() maxShowedCharachters: number;
  @Input() profanityFilter: boolean;
  @Input() languageSpecific;
  @Input() partialWords;

  isCollapsed = false;

  public badWords = [];
  questionWithoutProfanity: string = undefined;

  public parts: string[];
  public partsWithoutProfanity: string[];
  public partsShort: string[];
  public partsWithoutProfanityShort: string[];

  constructor(private profanityFilterService: ProfanityFilterService) {}

  get partsOfQuestion() {
    return this.profanityFilter ? this.partsWithoutProfanity : this.parts;
  }

  get partsOfShortQuestion(){
    return this.profanityFilter ? this.partsWithoutProfanityShort : this.partsShort;
  }

  splitShortQuestion(question: string){
    return question.slice(0, this.maxShowedCharachters).split(this.keyword);
  }

  splitQuestion(question: string){
    return question.split(this.keyword);
  }

  ngOnInit(): void {
    if (!this.language) {
      return;
    }
    this.question = ViewCommentDataComponent.getTextFromData(this.question);
    this.questionWithoutProfanity = this.profanityFilterService.
                                    filterProfanityWords(this.question, this.partialWords, this.languageSpecific, this.language);
    this.partsWithoutProfanity = this.splitQuestion(this.questionWithoutProfanity);
    this.parts = this.splitQuestion(this.question);
    this.partsWithoutProfanityShort = this.splitShortQuestion(this.questionWithoutProfanity);
    this.partsShort = this.splitShortQuestion(this.question);
  }
}
