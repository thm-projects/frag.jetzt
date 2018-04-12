import { Component, Input, OnInit } from '@angular/core';
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
  @Input() content: ContentText;

  dummyContent: ContentText = new ContentText('1',
    '1',
    '1',
    'Text Content 1',
    'This is the body of Text Content 1',
    1);

  textAnswer = '';
  isAnswerSent = false;

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
    this.isAnswerSent = true;
    // ToDo: Check correct api call
    this.answerService.addAnswerText({
      id: '0',
      revision: '0',
      contentId: this.content.contentId,
      round: this.content.round,
      subject: this.content.subject,
      body: this.textAnswer,
      read: 'false',
      creationTimestamp: new Date()
    } as AnswerText).subscribe();
    // TODO: Set isAnswerSent
  }

  abstain($event) {
    $event.preventDefault();
    console.log('abstain');
  }
}
