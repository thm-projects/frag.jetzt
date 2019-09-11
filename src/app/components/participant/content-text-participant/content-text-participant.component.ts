import { Component, Input, OnInit } from '@angular/core';
import { ContentText } from '../../../models/content-text';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { ContentType } from '../../../models/content-type.enum';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-content-text-participant',
  templateUrl: './content-text-participant.component.html',
  styleUrls: ['./content-text-participant.component.scss']
})
export class ContentTextParticipantComponent implements OnInit {
  @Input() content: ContentText;

  textAnswer = '';

  constructor(private answerService: ContentAnswerService,
              private notificationService: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService,
              public eventService: EventService) {
              langService.langEmitter.subscribe(lang => translateService.use(lang));
}

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  submitAnswer() {
    if (this.textAnswer.trim().valueOf() === '') {
      this.translateService.get('answer.please-answer').subscribe(message => {
        this.notificationService.show(message);
      });
      this.textAnswer = '';
      return;
    }
    this.translateService.get('answer.sent').subscribe(message => {
      this.notificationService.show(message);
    });
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
  }

  abstain($event) {
    $event.preventDefault();
    this.translateService.get('answer.abstention-sent').subscribe(message => {
      this.notificationService.show(message);
    });
  }
}
