import { Component, OnInit } from '@angular/core';
import { TextContent } from '../../../models/text-content';
import { ContentAnswerService } from '../../../content-answer.service';
import { AnswerText } from '../../../models/answer-text';

@Component({
  selector: 'app-participant-text-content',
  templateUrl: './participant-text-content.component.html',
  styleUrls: ['./participant-text-content.component.scss']
})
export class ParticipantTextContentComponent implements OnInit {
  content: TextContent = new TextContent('1',
    '1',
    '1',
    'Text Content 1',
    'This is the body of Text Content 1',
    1);

  constructor(private answerService: ContentAnswerService) {
  }

  ngOnInit() {
  }

  submitAnswer(answer: string) {
    this.answerService.addAnswerText({
      id: '0',
      revision: this.content.revision,
      contentId: this.content.contentId,
      round: this.content.round,
      subject: this.content.subject,
      body: answer,
      read: 'false',
      creationTimestamp: new Date()
    } as AnswerText).subscribe();
  }
}
