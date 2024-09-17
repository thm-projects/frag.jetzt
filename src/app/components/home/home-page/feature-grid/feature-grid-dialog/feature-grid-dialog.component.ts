import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FeatureGridComponent } from '../feature-grid.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-feature-grid-dialog',
  standalone: true,
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
