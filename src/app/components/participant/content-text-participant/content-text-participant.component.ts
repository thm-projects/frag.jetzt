import { Component, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { ContentType } from '../../../models/content-type.enum';

@Component({
  selector: 'app-content-text-participant',
  templateUrl: './content-text-participant.component.html',
  styleUrls: ['./content-text-participant.component.scss']
})
export class ContentTextParticipantComponent implements OnInit {
  @Input() content: ContentText;

  textAnswer = '';
  isAnswerSent = false;

  constructor(private answerService: ContentAnswerService,
              private notificationService: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService) {
              langService.langEmitter.subscribe(lang => translateService.use(lang));
}

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  submitAnswer() {
    if (this.textAnswer.trim().valueOf() === '') {
      this.notificationService.show('No empty answer allowed.');
      this.textAnswer = '';
      return;
    }
    this.isAnswerSent = true;
    this.answerService.addAnswerText({
      id: null,
      revision: null,
      contentId: this.content.id,
      round: this.content.round,
      subject: this.content.subject,
      body: this.textAnswer,
      read: 'false',
      creationTimestamp: null,
      format: ContentType.TEXT
    } as AnswerText).subscribe();
    // TODO: Set isAnswerSent
  }

  abstain($event) {
    $event.preventDefault();
    console.log('abstain');
  }
}
