import { Component } from '@angular/core';
import { PaymentComponent } from '../payment.component';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import rawI18n from '../i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-token-explanation-dialog',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatDialogModule,
    CustomMarkdownModule,
  ],
  templateUrl: './token-explanation-dialog.component.html',
  styleUrl: './token-explanation-dialog.component.scss',
})
export class TokenExplanationDialogComponent {
  protected readonly i18n = i18n;
  parent: PaymentComponent;
}
