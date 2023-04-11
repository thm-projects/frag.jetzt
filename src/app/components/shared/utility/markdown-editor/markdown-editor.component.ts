import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

export type MarkdownEditorTab = 'edit' | 'preview';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
})
export class MarkdownEditorComponent {
  @Input() public data: string;
  public readonly editorTab: FormControl<MarkdownEditorTab> =
    new FormControl<MarkdownEditorTab>('edit');

  private editorInputElement: ElementRef<HTMLDivElement>;

  constructor() {}

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
}
