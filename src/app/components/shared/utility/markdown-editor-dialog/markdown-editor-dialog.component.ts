import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReplaySubject, takeUntil } from 'rxjs';
import { LanguageService } from '../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

export interface MarkdownEditorDialogData {
  data: string;
}

@Component({
  selector: 'app-markdown-editor-dialog',
  templateUrl: './markdown-editor-dialog.component.html',
  styleUrls: ['./markdown-editor-dialog.component.scss'],
})
export class MarkdownEditorDialogComponent implements OnDestroy {
  public data: string;
  private readonly _destroyer = new ReplaySubject(1);

  constructor(
    public readonly languageService: LanguageService,
    public readonly http: HttpClient,
    public readonly translationService: TranslateService,
    public readonly dialogRef: MatDialogRef<MarkdownEditorDialogData>,
    @Inject(MAT_DIALOG_DATA)
    public readonly injection: MarkdownEditorDialogData,
  ) {
    this.data = injection.data;
    languageService
      .getLanguage()
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => {
        translationService.use(lang);
        http
          .get('/assets/i18n/utility-components/' + lang + '.json')
          .subscribe((translation) => {
            translationService.setTranslation(lang, translation, true);
          });
      });
  }

  ngOnDestroy() {
    this._destroyer.next(0);
  }
}
