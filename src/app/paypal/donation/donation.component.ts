import { Component } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatIconModule } from '@angular/material/icon';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [QRCodeModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.scss',
})
export class DonationComponent {
  protected readonly i18n = i18n;
  url = 'https://www.sandbox.paypal.com/ncp/payment/J4AV5JU5RMLU6';
  qrCodeSize: number = 200;
}