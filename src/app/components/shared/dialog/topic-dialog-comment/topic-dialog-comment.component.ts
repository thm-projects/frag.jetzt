import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss']
})
export class TopicDialogCommentComponent implements OnInit {

  @Input() question: string;
  @Input() keyword: string ;
  @Input() maxShowedCharachters: number;
  @Input() isCollapsed: boolean = false;
  constructor() { }

  get partsOfQuestion(){

    return this.question.slice(0,this.isCollapsed? this.question.length: this.maxShowedCharachters).split(new RegExp(this.keyword,'i')) ;

  }

  ngOnInit(): void {
  }
}
