import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';
import {
  MD_CUSTOM_TEXT_RENDERER,
  MD_PLUGINS,
} from '../markdown-common/plugins';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
})
export class MarkdownViewerComponent implements AfterViewInit, OnDestroy {
  data = input.required<string>();
  protected editorElement =
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
    effect(() => this.editor.setMarkdown(this.data()), {
      injector: this.injector,
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}