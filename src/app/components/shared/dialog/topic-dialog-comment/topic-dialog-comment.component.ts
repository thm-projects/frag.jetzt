import { Component, Input, OnInit } from '@angular/core';
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
  @Input() badWord: string;

  public badWords = [];
  questionWithProfinity: string = undefined;

  public shortQuestion: string;

  constructor(private topicCloudAdminService: TopicCloudAdminService) { }

  get partsOfQuestion() {
    if (this.profanityFilter) {
      return this.questionWithProfinity
          .slice(0,this.isCollapsed? this.questionWithProfinity.length: this.maxShowedCharachters)
          .split(new RegExp(this.keyword,'i'));
    } else {
      return this.question
          .slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters)
          .split(new RegExp(this.keyword,'i'));
    }
  }

  ngOnInit(): void {
    this.questionWithProfinity = this.topicCloudAdminService.filterProfanityWords(this.question);
  }
}
