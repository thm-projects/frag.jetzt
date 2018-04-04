import { Component, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-content-text-participant',
  templateUrl: './content-text-participant.component.html',
  styleUrls: ['./content-text-participant.component.scss']
})
export class ContentTextParticipantComponent implements OnInit {
  content: ContentText = new ContentText('1',
    '1',
    '1',
    'Text Content 1',
    'This is the body of Text Content 1',
    1);

  textAnswer = '';
  isAnswerSend = false;

  constructor(private answerService: ContentAnswerService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
  }

//  submitAnswer(answer: string) {
  submitAnswer() {
    if (this.textAnswer.trim().valueOf() === '') {
      this.notificationService.show('No empty answer allowed.');
      this.textAnswer = '';
      return;
    }
    this.isAnswerSend = true;
    this.notificationService.show('Answer successfully sent.');
/*    this.answerService.addAnswerText({
      id: '0',
      revision: this.content.revision,
      contentId: this.content.contentId,
      round: this.content.round,
      subject: this.content.subject,
      body: answer,
      read: 'false',
      creationTimestamp: new Date()
    } as AnswerText).subscribe(); */
  }
}
