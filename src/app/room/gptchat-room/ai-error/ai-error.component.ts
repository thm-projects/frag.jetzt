import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

@Component({
  selector: 'app-ai-error',
  imports: [CustomMarkdownModule, MatDialogModule, MatButtonModule],
  templateUrl: './ai-error.component.html',
  styleUrl: './ai-error.component.scss',
})
export class AiErrorComponent {
  protected readonly i18n = I18nLoader.builder().build();
  error = input.required<string>();

  static open(dialog: MatDialog, error: string): void {
    const ref = dialog.open(AiErrorComponent);
    ref.componentRef.setInput('error', error);
  }
}
