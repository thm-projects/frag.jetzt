import { Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss']
})
export class TopicDialogCommentComponent implements OnInit {

  @Input() question: string;
  @Input() keyword: string ;
  @Input() maxShowedCharachters: number;
  @Input() profanityFilter = true;
  isCollapsed = false;

  public badWords = [];
  questionWithoutProfanity: string = undefined;

  public parts: string[];
  public partsWithoutProfanity: string[];
  public partsShort: string[];
  public partsWithoutProfanityShort: string[];

  constructor(private topicCloudAdminService: TopicCloudAdminService) {}

  get partsOfQuestion() {
    return this.profanityFilter ? this.partsWithoutProfanity : this.parts;
  }

  get partsOfShortQuestion(){
    return this.profanityFilter ? this.partsWithoutProfanityShort : this.partsShort;
  }

  splitShortQuestion(question: string){
    const cleanedKeyword = this.keyword.replace(/([^a-z0-9]+)/gi, '');
    return question.slice(0, this.maxShowedCharachters).split(new RegExp(cleanedKeyword, 'i'));
  }

  splitQuestion(question: string){
    const cleanedKeyword = this.keyword.replace(/([^a-z0-9]+)/gi, '');
    return question.split(new RegExp(cleanedKeyword,'i'));
  }

  ngOnInit(): void {
    this.questionWithoutProfanity = this.topicCloudAdminService.filterProfanityWords(this.question, true, false);
    this.partsWithoutProfanity = this.splitQuestion(this.questionWithoutProfanity);
    this.parts = this.splitQuestion(this.question);
    this.partsWithoutProfanityShort = this.splitShortQuestion(this.questionWithoutProfanity);
    this.partsShort = this.splitShortQuestion(this.question);
  }
}
