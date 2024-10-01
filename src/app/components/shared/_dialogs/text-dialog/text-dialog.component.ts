import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  TextDialogConfig,
  DialogButton,
} from '../../../../services/http/text-dialog.service';
import { Observable } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { CustomMarkdownModule } from '../../../../base/custom-markdown/custom-markdown.module';

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
  constructor(
    public dialogRef: MatDialogRef<TextDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TextDialogConfig,
  ) {}

  // Handle button click events
  handleButtonClick(button: DialogButton) {
    if (button.onClick) {
      const result = button.onClick(this.dialogRef);

      if (result instanceof Observable) {
        // Handle observables (e.g., show spinner while the observable is active)
        result.subscribe({
          next: (res) => {
            if (res?.type === 'completed') {
              this.dialogRef.close();
            } else if (res?.type === 'error') {
              // Handle error (e.g., use a notification service)
              console.error(res.text);
            }
          },
        });
      } else if (result) {
        this.dialogRef.close();
      }
    }
  }
}
