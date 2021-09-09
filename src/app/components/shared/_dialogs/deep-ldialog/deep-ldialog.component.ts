import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';

interface ResultValue {
  body: string;
  text: string;
  view: ViewCommentDataComponent;
}

@Component({
  selector: 'app-deep-ldialog',
  templateUrl: './deep-ldialog.component.html',
  styleUrls: ['./deep-ldialog.component.scss']
})
export class DeepLDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('normal') normal: ViewCommentDataComponent;
  @ViewChild('improved') improved: ViewCommentDataComponent;
  radioButtonValue: ResultValue;
  normalValue: ResultValue;
  improvedValue: ResultValue;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private dialog: MatDialog) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.normalValue = {
      body: this.data.body,
      text: this.data.text,
      view: this.normal
    };
    this.improvedValue = {
      body: this.data.improvedBody,
      text: this.data.improvedText,
      view: this.improved
    };
    this.radioButtonValue = this.normalValue;
  }

  ngAfterViewInit() {
    this.normal.afterEditorInit = () => {
      this.normal.buildMarks(this.data.text, this.data.result);
    };
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildSubmitBodyActionCallback(): () => void {
    return () => {
      let current: ResultValue;
      if (this.radioButtonValue === this.normalValue) {
        this.normalValue.body = this.normal.currentData;
        this.normalValue.text = this.normal.currentText;
        this.normalValue.view = this.normal;
        current = this.normalValue;
      } else {
        this.improvedValue.body = this.improved.currentData;
        this.improvedValue.text = this.improved.currentText;
        this.improvedValue.view = this.improved;
        current = this.improvedValue;
      }
      if (WriteCommentComponent.checkInputData(current.body, current.text,
        this.translateService, this.notificationService, this.data.maxTextCharacters, this.data.maxDataCharacters)) {
        this.data.onClose(current.body, current.text, current.view);
        this.dialogRef.close();
      }
    };
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.deepl';
  }

}
