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
  @Input() isCollapsed = false;
  @Input() profanityFilter = true;

  public badWords = [];
  questionWithoutProfanity: string = undefined;

  public parts: string[];
  public partsWithoutProfanity: string[];
  public partsShort: string[];
  public partsWithoutProfanityShort: string[];

  constructor(private topicCloudAdminService: TopicCloudAdminService) { }

  get partsOfQuestion() {
    if (this.profanityFilter) {
      return this.partsWithoutProfanity;
    } else {
      return this.parts;
    }
  }

  get partsOfShortQuestion(){
    if (this.profanityFilter) {
      return this.partsWithoutProfanityShort;
    } else {
      return this.partsShort;
    }
  }

  ngOnInit(): void {
    this.questionWithoutProfanity = this.topicCloudAdminService.filterProfanityWords(this.question);
    this.partsWithoutProfanity = this.questionWithoutProfanity.split(new RegExp(this.keyword,'i'));
    this.parts = this.question.split(new RegExp(this.keyword,'i'));
    this.partsShort = this.question.slice(0, this.maxShowedCharachters)
    .split(new RegExp(this.keyword,'i'));
    this.partsWithoutProfanityShort = this.questionWithoutProfanity.slice(0, this.maxShowedCharachters)
    .split(new RegExp(this.keyword,'i'));
  }
}
