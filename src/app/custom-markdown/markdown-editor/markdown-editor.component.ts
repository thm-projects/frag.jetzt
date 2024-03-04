import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Editor } from '@toast-ui/editor';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements AfterViewInit {
  @ViewChild('editor')
  protected editorElement: ElementRef<HTMLDivElement>;
  private editor: Editor;

  ngAfterViewInit(): void {
    this.editor = new Editor({
      el: this.editorElement.nativeElement,
      minHeight: '800px',
      height: '800px',
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      usageStatistics: false,
      language: 'de',
      theme: 'fragjetzt',
    });
  }
}
