import { Component } from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { FeatureGridComponent } from '../feature-grid.component';
import rawI18n from './i18n.json';

// Load translations
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-feature-grid-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    FeatureGridComponent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
  ],
  templateUrl: './feature-grid-dialog.component.html',
  styleUrl: './feature-grid-dialog.component.scss',
})
export class FeatureGridDialogComponent {
  protected readonly i18n = i18n;
}
