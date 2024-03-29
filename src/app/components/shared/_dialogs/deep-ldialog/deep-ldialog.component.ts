import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { DeepLService, FormalityType } from '../../../../services/http/deep-l.service';
import { StandardDelta } from '../../../../utils/quill-utils';

export interface ResultValue {
  body: StandardDelta;
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
  supportsFormality: boolean;
  formality: FormalityType;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private deeplService: DeepLService,
    private dialog: MatDialog,
  ) {
    this.supportsFormality = DeepLService.supportsFormality(this.data.target);
  }

  ngOnInit(): void {
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
    this.formality = this.data.formality;
  }

  ngAfterViewInit() {
    const build = () => {
      this.normal.buildMarks(this.data.text, this.data.result);
    };
    if (this.normal.initialized) {
      build();
    } else {
      this.normal.afterEditorInit = build;
    }
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
      if (ViewCommentDataComponent.checkInputData(
        current.body, current.text, this.translateService, this.notificationService, this.data.maxTextCharacters,
        this.data.maxDataCharacters)) {
        this.data.onClose(current, true);
        this.dialogRef.close(true);
      }
    };
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.deepl';
  }

  onFormalityChange(formality: string) {
    this.deeplService.improveDelta(this.data.body, this.data.usedTarget, formality as FormalityType)
      .subscribe({
        next: ([improvedBody, improvedText]) => {
          this.improvedValue.body = improvedBody;
          this.improvedValue.text = improvedText;
          this.improved.currentData = improvedBody;
        },
        error: () => {
          this.translateService.get('deepl-formality-select.error').subscribe(str => {
            this.notificationService.show(str);
          });
        }
      });
  }

}
