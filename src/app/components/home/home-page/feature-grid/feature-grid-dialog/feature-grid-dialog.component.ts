import { Component } from '@angular/core';
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { FeatureGridComponent } from '../feature-grid.component';

@Component({
  selector: 'app-feature-grid-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, FeatureGridComponent],
  templateUrl: './feature-grid-dialog.component.html',
  styleUrl: './feature-grid-dialog.component.scss',
})
export class FeatureGridDialogComponent {}
