import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../../content-list/content-list.component';
import { DisplayAnswer } from '../../content-choice-creator/content-choice-creator.component';
import { ContentChoice } from '../../../../models/content-choice';
import { AnswerOption } from '../../../../models/answer-option';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';

@Component({
  selector: 'app-content-edit',
  templateUrl: './content-edit.component.html',
  styleUrls: ['./content-edit.component.scss']
})
export class ContentEditComponent implements OnInit {
  content: ContentChoice;
  displayAnswers: DisplayAnswer[] = [];
  displayedColumns = ['label', 'checked'];

  constructor(private translateService: TranslateService,
              private notificationService: NotificationService,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    for (let i = 0; i < this.content.options.length; i++) {
      let correct: boolean;
      correct = this.content.options[i].points > 0;
      this.displayAnswers[i] = new DisplayAnswer(new AnswerOption(this.content.options[i].label, this.content.options[i].points), correct);
    }
  }

  updateAnswer(index: number) {
    if (this.displayAnswers[index].correct === true) {
      this.content.options[index].points = 10;
    } else {
      this.content.options[index].points = -10;
    }
  }

  updateContent() {
    if (this.content.subject === '' || this.content.body === '') {
      this.translateService.get('content.no-empty').subscribe(message => {
        this.notificationService.show(message);
      });
      return;
    }
    if (this.content.options.length === 0) {
      this.translateService.get('content.need-answers').subscribe(message => {
        this.notificationService.show(message);
      });
      return;
    }
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label === '') {
        this.translateService.get('content.no-empty2').subscribe(message => {
          this.notificationService.show(message);
        });
        return;
      }
      if (this.content.options[i].points > 0 && this.content.multiple) {
        this.dialogRef.close('update');
      } else {
        this.translateService.get('content.at-least-one').subscribe(message => {
          this.notificationService.show(message);
        });
        return;
      }
    }
  }
}
