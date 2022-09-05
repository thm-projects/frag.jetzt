import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {SurveyPageComponent} from '../../survey/survey-page/survey-page.component';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatDialogConfig} from '@angular/material/dialog/dialog-config';
import {Survey} from '../../../../models/survey/survey';

@Component({
  selector: 'app-survey-create',
  templateUrl: './survey-create.component.html',
  styleUrls: ['./survey-create.component.scss']
})
export class SurveyCreateComponent implements OnInit {

  public static readonly dialogConfig: MatDialogConfig<SurveyCreateComponent> = {
    width: '800px'
  };

  public onClose: EventEmitter<Survey> = new EventEmitter<Survey>();

  public editSurvey = new Survey();
  private page: SurveyPageComponent;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
  }

  ngOnInit(): void {
  }

  init(page: SurveyPageComponent) {
    this.page = page;
  }

}
