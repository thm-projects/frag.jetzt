import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { ContextPipe } from 'app/base/i18n/context.pipe';

@Component({
  selector: 'app-remove-from-history',
  templateUrl: './remove-from-history.component.html',
  styleUrls: ['./remove-from-history.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    CustomMarkdownModule,
    ContextPipe,
  ],
})
export class RemoveFromHistoryComponent {
  protected readonly i18n = i18n;
  roomName = input.required<string>();

  static open(dialog: MatDialog, roomName: string) {
    const ref = dialog.open(RemoveFromHistoryComponent);
    ref.componentRef.setInput('roomName', roomName);
    return ref;
  }
}
