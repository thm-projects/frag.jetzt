import { Component, inject, input } from '@angular/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { from, isObservable, Observable } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { CustomMarkdownModule } from '../../../../base/custom-markdown/custom-markdown.module';
import { NotificationService } from 'app/services/util/notification.service';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import {
  DialogButton,
  DialogResult,
  TextDialogConfig,
} from './text-dialog.types';
const i18n = I18nLoader.builder().build();

@Component({
  selector: 'app-text-dialog',
  templateUrl: './text-dialog.component.html',
  standalone: true,
  imports: [
    MatButton,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    CustomMarkdownModule,
  ],
  styleUrls: ['./text-dialog.component.scss'],
})
export class TextDialogComponent {
  protected readonly i18n = i18n;
  protected data = input.required<TextDialogConfig>();
  private cachedClick: Set<DialogButton> = new Set();
  private dialogRef = inject(MatDialogRef<TextDialogComponent>);
  private notificaton = inject(NotificationService);

  static open(dialog: MatDialog, config: TextDialogConfig) {
    const ref = dialog.open(TextDialogComponent, {
      data: config,
      disableClose: !(config.allowClose ?? true),
    });
    ref.componentRef.setInput('data', config);
    return ref;
  }

  protected handleButtonClick(button: DialogButton) {
    if (!button.onClick) {
      return;
    }
    if (this.cachedClick.has(button)) {
      return;
    }
    const result = button.onClick(this.dialogRef);
    this.cachedClick.add(button);
    const observable = (
      isObservable(result) ? result : from(Promise.resolve(result))
    ) as Observable<DialogResult | boolean>;
    observable.subscribe({
      next: (value) => {
        if (!value) {
          return;
        }
        if (value === true || value.type === 'completed') {
          this.dialogRef.close();
          return;
        }
        if (value.type === 'error') {
          this.notificaton.show(value.text);
        }
      },
      complete: () => this.cachedClick.delete(button),
    });
  }
}
