import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  OnInit,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass } from '@angular/common';
import { ApiService } from './api.service';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import { language } from 'app/base/language/language';
import { MatListModule } from '@angular/material/list';
import { PaypalDialogComponent } from './paypal-dialog/paypal-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { user$, user, openLogin } from 'app/user/state/user';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { first, switchMap } from 'rxjs';
import { TokenExplanationDialogComponent } from './token-explanation-dialog/token-explanation-dialog.component';
import { i18nContext } from 'app/base/i18n/i18n-context';

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

// Define PayPal types
interface PayPalData {
  orderID: string;
}

// Define type for pricing plans
interface Plan {
  isSuggested: boolean;
  title: string;
  price: number;
  content?: string;
  priceContent?: string;
}

interface MarkdownInfo {
  inputTokens: string;
  inputWords: string;
  outputTokens: string;
  outputWords: string;
}

@Component({
  selector: 'app-payment',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    NgClass,
    MatListModule,
    CustomMarkdownModule,
    MatTableModule,
    MatExpansionModule,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  protected readonly i18n = i18n;
  protected readonly user = user;
  private apiService: ApiService = inject(ApiService);
  private injector = inject(Injector);
  private isPayPalLoaded = false;
  private userTokens = signal(0);
  tokens = computed(() => this.formatTokens(this.userTokens()));

  // Pricing plans
  plans: Plan[];

  constructor(private dialog: MatDialog) {
    applyDefaultNavigation(this.injector).subscribe();
  }

  openDialog(amount: number) {
    const ref = this.dialog.open(PaypalDialogComponent);
    ref.componentInstance.parent = this;
    ref.componentInstance.amount = amount;
  }

  openExplanationDialog() {
    const ref = this.dialog.open(TokenExplanationDialogComponent);
    ref.componentInstance.parent = this;
  }

  isRegisteredUser() {
    return this.user() && !this.user().isGuest;
  }

  ngOnInit() {
    this.updateQuota();
    this.loadPayPalScript();
    this.plans = [
      // TODO maybe recive from Backend
      {
        isSuggested: !this.isRegisteredUser(),
        title: !this.isRegisteredUser() ? i18n().suggested : i18n().free,
        price: 0,
      },
      {
        isSuggested: false,
        title: i18n().basic,
        price: 1,
      },
      {
        isSuggested: this.isRegisteredUser(),
        title: this.isRegisteredUser() ? i18n().suggested : i18n().standard,
        price: 5,
      },
      {
        isSuggested: false,
        title: i18n().premium,
        price: 10,
      },
      {
        isSuggested: false,
        title: i18n().special,
        price: 20,
      },
    ];
    effect(
      () => {
        this.plans.forEach((plan) => {
          const price = plan.price === 0 ? 1 : plan.price;
          const token = Math.floor((price * 1_000_000) / 15);
          plan.content = i18nContext(
            i18n().markdownInfo,
            this.getTokenExplanation(token) as unknown as Record<
              string,
              string
            >,
          );
          plan.priceContent = this.fromatPrice(plan.price);
        });
      },
      { injector: this.injector },
    );
  }

  loginPage() {
    openLogin().subscribe();
  }

  loadPayPalScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isPayPalLoaded) {
        resolve();
        return;
      }

      const scriptId = 'paypal-sdk';
      if (document.getElementById(scriptId)) {
        this.isPayPalLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://www.paypal.com/sdk/js?client-id=ATZFarfzWZCA0DB05S_7xGNEx7Gz_d_KAl7BkJwgaKBZgfpptY-mVw7jv0z9ctTHq92axuaQiPKg9xAu&currency=EUR';
      script.onload = () => {
        this.isPayPalLoaded = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Error loading PayPal script:', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }

  startPayPalPayment(amount: number, containerId: string) {
    if (!window['paypal']) {
      this.loadPayPalScript().then(() => {
        this.renderPayPalButton(amount, containerId);
      });
    } else {
      this.renderPayPalButton(amount, containerId);
    }
  }

  renderPayPalButton(amount: number, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container mit ID ${containerId} nicht gefunden.`);
      return;
    }
    container.style.display = 'block';

    window['paypal']
      .Buttons({
        funding: {
          allowed: [window['paypal'].FUNDING.PAYPAL], // Nur PayPal erlauben
          disallowed: [
            window['paypal'].FUNDING.CARD,
            window['paypal'].FUNDING.CREDIT,
            window['paypal'].FUNDING.VENMO,
            window['paypal'].FUNDING.SEPA,
            window['paypal'].FUNDING.BANCONTACT,
            window['paypal'].FUNDING.EPS,
            window['paypal'].FUNDING.GIROPAY,
            window['paypal'].FUNDING.IDEAL,
            window['paypal'].FUNDING.MERCADOPAGO,
            window['paypal'].FUNDING.MYBANK,
            window['paypal'].FUNDING.P24,
            window['paypal'].FUNDING.SOFORT,
          ],
        },
        createOrder: async () => {
          try {
            const response = await this.apiService
              .createOrder(amount, 'EUR', language())
              .toPromise();
            return response.id;
          } catch (error) {
            console.error('Error creating order:', error);
            throw new Error('Error creating order.');
          }
        },
        onApprove: async (data: PayPalData) => {
          try {
            await this.apiService.captureOrder(data.orderID).toPromise(); // Bestellung erfassen
            console.log('Transaction completed');
            this.handlePaymentSuccess(amount); // Benutzer-Tokens aktualisieren
          } catch (error) {
            console.error('Error capturing order:', error);
          }
        },
        onError: (err) => {
          console.error('Error during PayPal payment:', err);
        },
      })
      .render(`#${containerId}`); // Rendern im Container
  }

  handlePaymentSuccess(amount: number): void {
    console.info('Payment successful for amount:', amount);
    this.updateQuota();
  }

  private updateQuota() {
    user$
      .pipe(
        first(Boolean),
        switchMap(() => this.apiService.getCapturedQuota()),
      )
      .subscribe((quota) => {
        this.userTokens.set(quota.token);
      });
  }

  private getTokenExplanation(token: number): MarkdownInfo {
    return {
      inputTokens: this.formatNumbers(token * 3, false),
      inputWords: this.formatNumbers(token * 2.25, true),
      outputTokens: this.formatNumbers(token, false),
      outputWords: this.formatNumbers(token * 0.75, true),
    };
  }

  private formatNumbers(num: number, aboutSymbol: boolean): string {
    const format = new Intl.NumberFormat(language(), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      maximumSignificantDigits: 2,
      notation: 'compact',
    });
    const pre = aboutSymbol ? '~ ' : '';
    if (num >= 995 && num < 995_000 && language() === 'de') {
      num /= 1_000;
      return `${pre}${format.format(num)} Tsd.`;
    }
    return pre + format.format(num);
  }

  private fromatPrice(amount: number): string {
    const format = new Intl.NumberFormat(language(), {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      notation: 'compact',
    });
    return format.format(amount);
  }

  private formatTokens(tokens: number): string {
    return new Intl.NumberFormat(language(), {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(tokens);
  }
}
