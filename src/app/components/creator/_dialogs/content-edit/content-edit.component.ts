import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../../content-list/content-list.component';
import { DisplayAnswer } from '../../content-choice-creator/content-choice-creator.component';
import { ContentChoice } from '../../../../models/content-choice';
import { AnswerOption } from '../../../../models/answer-option';

@Component({
  selector: 'app-content-edit',
  templateUrl: './content-edit.component.html',
  styleUrls: ['./content-edit.component.scss']
})
export class ContentEditComponent implements OnInit {
  content: ContentChoice;
  displayAnswers: DisplayAnswer[] = [];
  displayedColumns = ['label', 'checked'];

  constructor(public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    for (let i = 0; i < this.content.options.length; i++) {
      let correct: boolean;
      correct = this.content.options[i].points > 0;
      this.displayAnswers[i] = new DisplayAnswer(new AnswerOption(this.content.options[i].label, this.content.options[i].points), correct);
    }
  }

  update(index: number) {
    if (this.displayAnswers[index].correct === true) {
      this.content.options[index].points = 10;
    } else {
      this.content.options[index].points = -10;
    }
  }
}
