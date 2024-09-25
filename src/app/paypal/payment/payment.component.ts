import { Component, inject, Injector, OnInit } from '@angular/core';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass, NgForOf } from '@angular/common';
import { ApiService } from './api.service';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

// Define PayPal types
interface PayPalData {
  orderID: string;
}

// Define type for pricing plans
interface Plan {
  title: string;
  price: string;
  tokens: number;
  color: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    M3BodyPaneComponent,
    M3SupportingPaneComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    NgClass,
    NgForOf,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  protected readonly i18n = i18n;
  apiService: ApiService = inject(ApiService);
  private injector = inject(Injector);

  userTokens = 0; // Current token count of the user

  // Pricing plans
  plans: Plan[] = [
    {
      title: 'Free Plan',
      price: '0',
      tokens: 50000,
      color: 'grey',
    },
    { title: '€5 Plan', price: '5', tokens: 50000, color: 'primary' },
    { title: '€10 Plan', price: '10', tokens: 106000, color: 'primary' },
    { title: '€20 Plan', price: '20', tokens: 212000, color: 'primary' },
    { title: '€50 Plan', price: '50', tokens: 530000, color: 'primary' },
  ];

  constructor() {
    applyDefaultNavigation(this.injector).subscribe();
  }

  ngOnInit() {
    this.getUserTokens();
    this.loadPayPalScript();
  }

  getUserTokens() {
    // Simulate retrieving the user's token count from a service or backend
    this.userTokens = 50000; // Example token count, replace with actual value
  }

  //Ab hier Paypal Intergration
  private isPayPalLoaded = false;

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
      console.error(`Container with ID ${containerId} not found.`);
      return;
    }
    container.style.display = 'block';

    window['paypal']
      .Buttons({
        funding: {
          allowed: [window['paypal'].FUNDING.PAYPAL], // Specify only PayPal funding source
          disallowed: [window['paypal'].FUNDING.CARD], // Optionally disallow others
        },
        createOrder: async () => {
          try {
            const response = await this.apiService
              .createOrder(amount)
              .toPromise();
            return response.id; // Return the order ID
          } catch (error) {
            console.error('Error creating order:', error);
            throw new Error('Error creating order.');
          }
        },
        onApprove: async (data: PayPalData) => {
          console.log(data);
          try {
            await this.apiService.captureOrder(data.orderID).toPromise(); // Capture the order
            console.log('Transaction completed');
            this.handlePaymentSuccess(amount); // Update user tokens
          } catch (error) {
            console.error('Error capturing order:', error);
          }
        },
        onError: (err) => {
          console.error('Error during PayPal payment:', err);
        },
      })
      .render(`#${containerId}`); // Render in the container
  }

  handlePaymentSuccess(amount: number): void {
    const plan = this.plans.find((p) => parseFloat(p.price) === amount); // Compare price as number
    if (plan) {
      this.userTokens += plan.tokens; // Increase the user's token count
    } else {
      console.warn('Unknown payment amount:', amount);
    }
  }

  protected readonly parseFloat = parseFloat;
}
