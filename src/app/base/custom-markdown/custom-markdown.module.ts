import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownEditorComponent } from './markdown-editor/markdown-editor.component';
import { MarkdownViewerComponent } from './markdown-viewer/markdown-viewer.component';
import '@toast-ui/editor';
// en is default imported
import '@toast-ui/editor/dist/i18n/de-de';
import '@toast-ui/editor/dist/i18n/fr-fr';

@NgModule({
  declarations: [MarkdownEditorComponent, MarkdownViewerComponent],
  imports: [CommonModule],
  exports: [MarkdownEditorComponent, MarkdownViewerComponent],
})
export class CustomMarkdownModule {
  constructor() {}
}
