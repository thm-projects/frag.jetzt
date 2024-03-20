import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';
import { MD_EXAMPLE, MD_PLUGINS } from '../markdown-common/plugins';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
})
export class MarkdownViewerComponent implements AfterViewInit {
  @ViewChild('editor')
  protected editorElement: ElementRef<HTMLDivElement>;
  private editor: EditorCore | Viewer;

  ngAfterViewInit(): void {
    const container = this.editorElement.nativeElement;
    this.editor = Editor.factory({
      el: container,
      usageStatistics: false,
      theme: 'fragjetzt',
      viewer: true,
      plugins: MD_PLUGINS,
      initialValue: MD_EXAMPLE,
    });
  }
}
