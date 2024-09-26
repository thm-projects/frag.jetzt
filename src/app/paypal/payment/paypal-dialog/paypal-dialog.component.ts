import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-paypal-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
  ],
  templateUrl: './paypal-dialog.component.html',
  styleUrl: './paypal-dialog.component.scss',
})
export class PaypalDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaypalDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; paypalContainerId: string },
  ) {}
}
