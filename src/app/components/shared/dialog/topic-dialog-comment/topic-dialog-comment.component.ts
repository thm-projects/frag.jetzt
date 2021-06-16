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

  public shortQuestion: string;
  public parts: string[];
  public partsWithoutProfanity: string[];

  constructor(private topicCloudAdminService: TopicCloudAdminService) { }

  get partsOfQuestion() {
    if (this.profanityFilter) {
      return this.partsWithoutProfanity;
    } else {
      return this.parts;
    }
  }

  ngOnInit(): void {
    this.questionWithoutProfanity = this.topicCloudAdminService.filterProfanityWords(this.question);
    this.partsWithoutProfanity = this.questionWithoutProfanity.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters)
                                                              .split(new RegExp(this.keyword,'i'));
    this.parts = this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters)
                              .split(new RegExp(this.keyword,'i'));
  }
}
