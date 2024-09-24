import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
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

// Load the i18n data
const i18n = I18nLoader.load(rawI18n);

// Define PayPal types
interface PayPalData {
  orderID: string;
}

interface PayPalActions {
  order: {
    create: (orderDetails: {
      purchase_units: { amount: { value: string } }[];
    }) => Promise<{ id: string }>;
    capture: () => Promise<void>;
  };
}

// Define the structure for PayPal buttons options
interface PayPalButtons {
  createOrder: (
    data: PayPalData,
    actions: PayPalActions,
  ) => Promise<{ id: string }>;
  onApprove: (data: PayPalData, actions: PayPalActions) => Promise<void>;
  onError: (err: unknown) => void;
}

// Define type for pricing plans
interface Plan {
  title: string;
  price: string;
  tokens: number;
  color: string;
}

// Define the structure for the global paypal object
declare const paypal: {
  Buttons: (options: PayPalButtons) => {
    render: (containerId: string) => void;
  };
};

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
export class PaymentComponent implements OnInit, AfterViewInit {
  protected readonly i18n = i18n;
  apiService: ApiService = inject(ApiService);

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

  ngOnInit() {
    this.loadPayPalScript()
      .then(() => {
        this.checkUserPlan();
        this.getUserTokens();
      })
      .catch((error) => {
        console.error('Failed to load PayPal script:', error);
      });
  }

  ngAfterViewInit() {
    // Render PayPal buttons for each plan after the view initializes
    this.plans.forEach((plan) => this.renderPayPalButtons(plan));
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

  loadPayPalScript(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Check if the PayPal script is already loaded
      const scriptId = 'paypal-sdk'; // Unique ID for the PayPal script
      if (document.getElementById(scriptId)) {
        resolve(); // If the script is already loaded, resolve immediately
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId; // Set the unique ID
      script.src =
        'https://www.paypal.com/sdk/js?client-id=ATZFarfzWZCA0DB05S_7xGNEx7Gz_d_KAl7BkJwgaKBZgfpptY-mVw7jv0z9ctTHq92axuaQiPKg9xAu&currency=EUR';
      script.onload = () => resolve(); // Resolve when the script loads successfully
      script.onerror = (error) => {
        console.error('Error loading PayPal script:', error);
        reject(error); // Reject if there is an error loading the script
      };
      document.body.appendChild(script); // Append the script to the document
    });
  }

  renderPayPalButtons(plan: Plan): void {
    const containerId = `paypal-button-container-${plan.price.replace('€', '').replace('.', '-')}`;
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'block'; // Make the container visible
      this.startPayPalPayment(
        parseFloat(plan.price.replace('€', '').replace(',', '.')),
        containerId,
      );
    }
  }

  startPayPalPayment(amount: number, containerId: string): void {
    const amountString = amount.toFixed(2); // Format to two decimal places
    paypal
      .Buttons({
        createOrder: (data: PayPalData, actions: PayPalActions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amountString, // Use the formatted string here
                },
              },
            ],
          });
        },
        onApprove: (data: PayPalData, actions: PayPalActions) => {
          return actions.order.capture().then(() => {
            alert('Payment completed successfully!');
            this.handlePaymentSuccess(amount);
          });
        },
        onError: (err: unknown) => {
          console.error('Payment error:', err);
          alert('Error processing payment. Please try again.');
        },
      })
      .render(`#${containerId}`); // Render in the specific container
  }

  handlePaymentSuccess(amount: number): void {
    const plan = this.plans.find((p) => parseFloat(p.price) === amount); // Compare price as number
    if (plan) {
      this.userTokens += plan.tokens; // Increase the user's token count
      // Add logic here to update the user in the backend
    } else {
      console.warn('Unknown payment amount:', amount);
    }
  }

  protected readonly parseFloat = parseFloat;
}
