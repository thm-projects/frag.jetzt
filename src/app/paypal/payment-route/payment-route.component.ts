import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { paymentConfig } from 'environments/paypal.config';

@Component({
  selector: 'app-payment-route',
  imports: [NgComponentOutlet],
  templateUrl: './payment-route.component.html',
  styleUrl: './payment-route.component.scss',
})
export class PaymentRouteComponent {
  readonly payComponent = paymentConfig.payment_component;
}
