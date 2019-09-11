import { Component, Inject, OnInit } from '@angular/core';
import { ContentChoiceCreatorComponent, DisplayAnswer } from '../../content-choice-creator/content-choice-creator.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { EventService } from '../../../../services/util/event.service';



@Component({
  selector: 'app-answer-edit',
  templateUrl: './answer-edit.component.html',
  styleUrls: ['./answer-edit.component.scss']
})
export class AnswerEditComponent implements OnInit {
  answer: DisplayAnswer;

  constructor(public dialogRef: MatDialogRef<ContentChoiceCreatorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
  }

  ngOnInit() {
  }
}
