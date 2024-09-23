import { Component } from '@angular/core';
import { M3BodyPaneComponent } from 'modules/m3/components/layout/m3-body-pane/m3-body-pane.component';
import { M3SupportingPaneComponent } from 'modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NgClass } from '@angular/common';

import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);

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
    NgClass
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  protected readonly i18n = i18n;

  // User's token status and whether they have purchased the free plan
  userTokens = 0; // Example: Number of tokens the user has
  hasFreePlan = false; // Change this to true if the user has purchased the Free Plan

  // Pricing plans data
  plans = [
    { title: 'Free Plan', price: '€0', color: this.getFreePlanColor() },
    { title: '€5 Plan', price: '€5', color: 'primary' },
    { title: '€10 Plan', price: '€10', color: 'primary' },
    { title: '€20 Plan', price: '€20', color: 'primary' },
    { title: '€50 Plan', price: '€50', color: 'primary' }
  ];

  // Function to change the color of the Free Plan card
  getFreePlanColor(): string {
    return this.hasFreePlan ? 'grey' : 'blue';
  }

  // Function to toggle Free Plan purchase
  purchaseFreePlan(): void {
    this.hasFreePlan = !this.hasFreePlan;
    // Update Free Plan color
    this.plans[0].color = this.getFreePlanColor();
  }

  selectFreePlan() {
    this.hasFreePlan = true;
    // Logic to update user plan, tokens, etc.
  }
}
