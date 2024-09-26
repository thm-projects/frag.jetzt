import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { paymentConfig } from 'environments/paypal.config';
import { donationConfig } from 'environments/paypal.config';

@Component({
  selector: 'app-payment-route',
  standalone: true,
  imports: [NgComponentOutlet],
  templateUrl: './payment-route.component.html',
  styleUrl: './payment-route.component.scss',
})
export class PaymentRouteComponent {
  readonly payComponent = paymentConfig.payment_component;
}

export class DonationRouteComponent {
  readonly donComponent = donationConfig.donation_component;
}
