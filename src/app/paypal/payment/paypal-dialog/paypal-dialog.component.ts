import { Component, OnInit } from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { PaymentComponent } from '../payment.component';
import rawI18n from '../i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);
@Component({
  selector: 'app-paypal-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatDialogModule,
  ],
  templateUrl: './paypal-dialog.component.html',
  styleUrl: './paypal-dialog.component.scss',
})
export class PaypalDialogComponent implements OnInit {
  protected readonly i18n = i18n;
  parent: PaymentComponent;
  amount: number;

  constructor(public dialogRef: MatDialogRef<PaypalDialogComponent>) {}

  ngOnInit(): void {
    this.parent.startPayPalPayment(this.amount, 'paypal-payment');
  }
}
