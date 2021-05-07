import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-topic-dialog-comment',
  templateUrl: './topic-dialog-comment.component.html',
  styleUrls: ['./topic-dialog-comment.component.scss']
})
export class TopicDialogCommentComponent implements OnInit {

  @Input() question: string;
  @Input() maxShowedCharachters: number;
  @Input() isCollapsed: boolean = false;
  constructor() { }

  ngOnInit(): void {
  }
}
