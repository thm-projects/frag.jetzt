import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReplaySubject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from 'app/services/state/app-state.service';

export type MarkdownEditorTab = 'edit' | 'preview';

@Component({
  selector: 'app-markdown-editor2',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
})
export class MarkdownEditorComponent implements OnDestroy {
  @Input() public data: string;
  public readonly editorTab: FormControl<MarkdownEditorTab> =
    new FormControl<MarkdownEditorTab>('edit');

  private editorInputElement: ElementRef<HTMLDivElement>;
  private readonly _destroyer = new ReplaySubject(1);

  constructor(
    public readonly http: HttpClient,
    public readonly translationService: TranslateService,
    appState: AppStateService,
  ) {
    appState.language$.pipe(takeUntil(this._destroyer)).subscribe((lang) => {
      translationService.use(lang);
      http
        .get('/assets/i18n/utility-components/' + lang + '.json')
        .subscribe((translation) => {
          translationService.setTranslation(lang, translation, true);
        });
    });
  }

  @ViewChild('editorInputElement')
  set setEditorInputElement(editorInputElement: ElementRef<HTMLDivElement>) {
    if (editorInputElement) {
      if (this.data && editorInputElement.nativeElement) {
        editorInputElement.nativeElement.innerText = this.data;
      }
    }
    this.editorInputElement = editorInputElement;
  }

  updateText(editorInputElement: HTMLDivElement) {
    this.data = editorInputElement.innerText;
  }

  ngOnDestroy() {
    this._destroyer.next(0);
  }
}
