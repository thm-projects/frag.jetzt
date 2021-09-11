import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { DeepLService, FormalityType, TargetLang } from '../../../../services/http/deep-l.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Target } from '@angular/compiler';

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
  supportsFormality: boolean;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private deeplService: DeepLService,
    private dialog: MatDialog) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
    this.supportsFormality = DeepLService.supportsFormality(this.data.target);
  }

  public static generateDeeplDelta(deepl: DeepLService, body: string, targetLang: TargetLang,
                                   formality = FormalityType.less): Observable<[string, string]> {
    const delta = ViewCommentDataComponent.getDeltaFromData(body);
    const xml = delta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] === 'string' && e['insert'].trim().length) {
        acc += '<x i="' + i + '">' + this.encodeHTML(e['insert']) + '</x>';
        e['insert'] = '';
      }
      return acc;
    }, '');
    return deepl.improveTextStyle(xml, targetLang, formality).pipe(
      map(str => {
        const regex = /<x i="(\d+)">([^<]+)<\/x>/gm;
        let m;
        while ((m = regex.exec(str)) !== null) {
          delta.ops[+m[1]]['insert'] += this.decodeHTML(m[2]);
        }
        const text = delta.ops.reduce((acc, el) => acc + (typeof el['insert'] === 'string' ? el['insert'] : ''), '');
        return [ViewCommentDataComponent.getDataFromDelta(delta), text];
      })
    );
  }

  private static encodeHTML(str: string): string {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static decodeHTML(str: string): string {
    return str.replace(/&apos;/g, '\'')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
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
    DeepLDialogComponent.generateDeeplDelta(this.deeplService, this.data.body, this.data.usedTarget, formality as FormalityType)
      .subscribe(([improvedBody, improvedText]) => {
        console.log(improvedBody, improvedText);
        this.improvedValue.body = improvedBody;
        this.improvedValue.text = improvedText;
        this.improved.currentData = improvedBody;
      }, (_) => {
        this.translateService.get('deepl-formality-select.error').subscribe(str => {
          this.notificationService.show(str);
        });
      });
  }

}
