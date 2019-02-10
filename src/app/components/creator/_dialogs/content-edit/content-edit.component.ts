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
  displayedColumns = ['label'];

  constructor(public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    for (let i = 0; i < this.content.options.length; i++) {
      let correct: boolean;
      if (this.content.options[i].points < 0) {
        correct = false;
      } else {
        correct = true;
      }
      this.displayAnswers[i] = new DisplayAnswer(new AnswerOption(this.content.options[i].label, this.content.options[i].points), correct);
    }
  }

  onNoClick(): void {
    this.dialogRef.close('abort');
  }
}
