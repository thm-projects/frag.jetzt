import { Component, OnInit, OnDestroy } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { MatIconModule } from '@angular/material/icon';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { AppTitleStrategy } from 'app/services/title/app-title-strategy';

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
export class DonationComponent implements OnInit, OnDestroy {
  protected readonly i18n = i18n;
  url = 'https://www.paypal.com/ncp/payment/4KQYM3Z6NRRCS';
  qrCodeSize: number = 200;

  private readonly DIALOG_TITLE_KEY = 'DONATION_DIALOG';

  constructor(private readonly appTitleStrategy: AppTitleStrategy) {}

  ngOnInit(): void {
    this.appTitleStrategy.setDialogTitle(this.DIALOG_TITLE_KEY);
  }

  ngOnDestroy(): void {
    this.appTitleStrategy.restoreOriginalTitle();
  }
}
