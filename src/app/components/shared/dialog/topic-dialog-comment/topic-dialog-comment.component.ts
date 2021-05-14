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
    const q = this.profanityFilter ? this.questionWithProfinity.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters) :
              this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters);
    const q2 = q.split(' ');
    return q2;
  }

  ngOnInit(): void {
    this.questionWithProfinity = this.topicCloudAdminService.filterProfanityWords(this.question);
  }
}
