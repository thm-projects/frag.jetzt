import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatIconModule } from '@angular/material/icon';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { ContextPipe } from 'app/base/i18n/context.pipe';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-donation',
  imports: [
    QRCodeComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CustomMarkdownModule,
    ContextPipe,
  ],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.scss',
})
export class DonationComponent {
  protected readonly i18n = i18n;
  url = 'https://www.sandbox.paypal.com/ncp/payment/J4AV5JU5RMLU6';
  qrCodeSize: number = 200;
}
