import { Component } from '@angular/core';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { FeatureGridComponent } from '../feature-grid.component';
import { MatButton } from "@angular/material/button";

@Component({
  selector: 'app-feature-grid-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, FeatureGridComponent, MatDialogActions, MatDialogClose, MatButton],
  templateUrl: './feature-grid-dialog.component.html',
  styleUrl: './feature-grid-dialog.component.scss',
})
export class FeatureGridDialogComponent {}
