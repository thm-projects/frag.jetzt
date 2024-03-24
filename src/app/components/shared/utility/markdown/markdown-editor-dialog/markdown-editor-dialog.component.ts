import { Component, Inject, OnDestroy, signal } from '@angular/core';
import { ReplaySubject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from 'app/services/state/app-state.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MarkdownEditorDialogData {
  data: string | undefined;
  useTemplate?: boolean;
}

@Component({
  selector: 'app-markdown-editor-dialog',
  templateUrl: './markdown-editor-dialog.component.html',
  styleUrls: ['./markdown-editor-dialog.component.scss'],
})
export class MarkdownEditorDialogComponent implements OnDestroy {
  public data = signal('');
  private readonly _destroyer = new ReplaySubject(1);

  constructor(
    readonly appState: AppStateService,
    public readonly http: HttpClient,
    public readonly translationService: TranslateService,
    public readonly dialogRef: MatDialogRef<MarkdownEditorDialogData>,
    @Inject(MAT_DIALOG_DATA)
    public readonly injection: MarkdownEditorDialogData,
  ) {
    this.data.set(injection.data);
    appState.language$.pipe(takeUntil(this._destroyer)).subscribe((lang) => {
      translationService.use(lang);
      http
        .get('/assets/i18n/utility-components/' + lang + '.json')
        .subscribe((translation) => {
          translationService.setTranslation(lang, translation, true);
          if (injection.useTemplate && (!this.data || this.data.length === 0)) {
            this.translationService
              .get('utility.markdown-editor-dialog.template')
              .subscribe((data) => {
                this.data = data;
              });
          } else {
            this.data.set(injection.data);
          }
        });
    });
  }

  ngOnDestroy() {
    this._destroyer.next(0);
  }

  close(data: string) {
    this.dialogRef.close(data);
  }
}
