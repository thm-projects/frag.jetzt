import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { AnswerOption } from '../../../models/answer-option';
import { NotificationService } from '../../../services/util/notification.service';
import { ContentType } from '../../../models/content-type.enum';
import { ContentService } from '../../../services/http/content.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-content-yes-no-creator',
  templateUrl: './content-yes-no-creator.component.html',
  styleUrls: ['./content-yes-no-creator.component.scss']
})
export class ContentYesNoCreatorComponent implements OnInit {
  @Input() contentSub;
  @Input() contentBod;
  @Input() contentCol;
  @Output() reset = new EventEmitter<boolean>();

  yesno = true;
  answerLabels = [
    'yes',
    'no'
  ];
  content: ContentChoice = new ContentChoice(
    '0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    [],
    false,
    ContentType.BINARY
  );

  roomId: string;

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = 0;

  constructor(private contentService: ContentService,
              private notificationService: NotificationService,
              private translationService: TranslateService) {
  }

  ngOnInit() {
    this.roomId = localStorage.getItem('roomId');
    for (let i = 0; i < this.answerLabels.length; i++) {
      this.content.options.push(new AnswerOption(this.answerLabels[i], this.newAnswerOptionPoints));
    }
    this.fillCorrectAnswers();
  }

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  resetAfterSubmit() {
    this.reset.emit(true);
    this.content.correctOptionIndexes = [];
    this.fillCorrectAnswers();
    this.translationService.get('content.submitted').subscribe(message => {
      this.notificationService.show(message);
    });
  }

  submitContent(): void {
    if (this.contentSub === '' || this.contentBod === '') {
      this.translationService.get('content.no-empty').subscribe(message => {
        this.notificationService.show(message);
      });
      return;
    }
    if (this.yesno) {
      this.content.options[0].points = 10;
      this.content.options[1].points = -10;
      this.content.correctOptionIndexes = [0];
    } else {
      this.content.options[0].points = -10;
      this.content.options[1].points = 10;
      this.content.correctOptionIndexes = [1];
    }
    let contentGroup: string;
    if (this.contentCol === 'Default') {
      contentGroup = '';
    } else {
      contentGroup = this.contentCol;
    }
    this.contentService.addContent(new ContentChoice(
      null,
      null,
      this.roomId,
      this.contentSub,
      this.contentBod,
      1,
      [contentGroup],
      this.content.options,
      this.content.correctOptionIndexes,
      this.content.multiple,
      ContentType.BINARY
    )).subscribe();
    this.resetAfterSubmit();
  }
}
