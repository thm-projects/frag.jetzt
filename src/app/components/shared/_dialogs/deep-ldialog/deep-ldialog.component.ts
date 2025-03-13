import { Component, Inject, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import {
  DeepLService,
  FormalityType,
  TargetLang,
} from '../../../../services/http/deep-l.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { LanguagetoolResult } from 'app/services/http/languagetool.service';

export interface ResultValue {
  body: string;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  view: any;
}

interface DialogData {
  body: string;
  text: string;
  improvedBody: string;
  improvedText: string;
  result: LanguagetoolResult;
  target: TargetLang;
  usedTarget: TargetLang;
  maxTextCharacters: number;
  maxDataCharacters: number;
  formality: FormalityType;
  isModerator: boolean;
  onClose: (result: ResultValue, submit: boolean) => void;
}

@Component({
  selector: 'app-deep-ldialog',
  templateUrl: './deep-ldialog.component.html',
  styleUrls: ['./deep-ldialog.component.scss'],
  standalone: false,
})
export class DeepLDialogComponent implements OnInit {
  radioButtonValue: ResultValue;
  normalValue: ResultValue;
  improvedValue: ResultValue;
  supportsFormality: boolean;
  formality: FormalityType;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
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
      view: null,
    };
    this.improvedValue = {
      body: this.data.improvedBody,
      text: this.data.improvedText,
      view: null,
    };
    this.radioButtonValue = this.normalValue;
    this.formality = this.data.formality;
  }

  protected submit() {}

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.deepl';
  }

  onFormalityChange() {
    this.deeplService.improveDelta(this.data.body).subscribe({
      next: ([improvedBody, improvedText]) => {
        this.improvedValue.body = improvedBody;
        this.improvedValue.text = improvedText;
        // this.improved.currentData = improvedBody;
      },
      error: () => {
        this.translateService
          .get('deepl-formality-select.error')
          .subscribe((str) => {
            this.notificationService.show(str);
          });
      },
    });
  }
}
