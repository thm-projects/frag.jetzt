import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  untracked,
  viewChild,
} from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';
import {
  MD_CUSTOM_TEXT_RENDERER,
  MD_PLUGINS,
} from '../markdown-common/plugins';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
  standalone: false,
})
export class MarkdownViewerComponent implements AfterViewInit, OnDestroy {
  data = input.required<string>();
  renderedPreview$ = new ReplaySubject<unknown>();
  public editorElement =
    viewChild.required<ElementRef<HTMLDivElement>>('editor');
  private injector = inject(Injector);
  private editor: EditorCore | Viewer;

  ngAfterViewInit(): void {
    const container = this.editorElement().nativeElement;
    this.editor = Editor.factory({
      el: container,
      usageStatistics: false,
      theme: 'fragjetzt',
      viewer: true,
      plugins: MD_PLUGINS,
      customHTMLRenderer: MD_CUSTOM_TEXT_RENDERER,
    });
    this.editor.on('updatePreview', (e) =>
      untracked(() => this.renderedPreview$.next(e)),
    );
    effect(() => this.editor.setMarkdown(this.mdData()), {
      injector: this.injector,
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  private mdData() {
    const data = this.data();
    if (!data) {
      return '';
    }
    return data
      .replace(/\\(\)|\()/gm, '$')
      .replace(/^\s*\\\[$/gm, '$$$$katex')
      .replace(/^\s*\\\]\s*$/gm, '$$$$')
      .replace(/^\s*\\\[/gm, '$$$$katex\n')
      .replace(/\s*\\\]\s*$/gm, '\n$$$$');
  }
}
