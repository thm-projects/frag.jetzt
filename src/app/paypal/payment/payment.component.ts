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
  hasFreePlan = false; // Indicates if the user has purchased the free plan

  // Pricing plans
  plans: Plan[] = [
    {
      title: 'Free Plan',
      price: '0',
      tokens: 50000,
      color: this.getFreePlanColor(),
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
    this.checkUserPlan();
    this.getUserTokens();
    this.loadPayPalScript();
  }

  checkUserPlan() {
    // Simulate checking the user's plan from a service or backend
    this.hasFreePlan = false; // Change this to true to simulate the acquired plan
  }

  getUserTokens() {
    // Simulate retrieving the user's token count from a service or backend
    this.userTokens = 50000; // Example token count, replace with actual value
  }

  selectFreePlan() {
    if (!this.hasFreePlan) {
      this.hasFreePlan = true;
      this.userTokens += 50000; // Add the free plan tokens

      // Logic to update the backend about the purchase
      // this.userService.updateUserPlan('free');
    }
  }

  // Function to change the card color for the free plan
  getFreePlanColor(): string {
    return this.hasFreePlan ? 'grey' : 'blue';
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
      console.error(`Container mit ID ${containerId} nicht gefunden.`);
      return;
    }
    container.style.display = 'block';

    window['paypal']
      .Buttons({
        createOrder: async () => {
          try {
            const response = await this.apiService
              .createOrder(amount)
              .toPromise();
            return response.id; // Gib die Order-ID zurück
          } catch (error) {
            console.error('Fehler beim Erstellen der Bestellung:', error);
            throw new Error('Fehler beim Erstellen der Bestellung.');
          }
        },
        onApprove: async (data: PayPalData) => {
          try {
            await this.apiService.captureOrder(data.orderID).toPromise(); // Fange die Bestellung
            console.log('Transaction completed by');
            this.handlePaymentSuccess(amount); // Aktualisiere die Benutzer-Tokens
          } catch (error) {
            console.error('Fehler beim Erfassen der Bestellung:', error);
          }
        },
        onError: (err) => {
          console.error('Fehler beim PayPal-Zahlung:', err);
        },
      })
      .render(`#${containerId}`); // Render in den Container
  }

  handlePaymentSuccess(amount: number): void {
    const plan = this.plans.find((p) => parseFloat(p.price) === amount); // Compare price as number
    if (plan) {
      this.userTokens += plan.tokens; // Increase the user's token count
      // Add logic here to update the user in the backend
      this.apiService.captureOrder(plan.title).subscribe(
        (response) => {
          console.log('Tokens updated successfully:', response);
          // Handle any UI updates or notifications here
        },
        (error) => {
          console.error('Error updating tokens:', error);
        },
      );
    } else {
      console.warn('Unknown payment amount:', amount);
    }
  }

  protected readonly parseFloat = parseFloat;
}
