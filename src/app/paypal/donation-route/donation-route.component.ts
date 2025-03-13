import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { donationConfig } from 'environments/paypal.config';

@Component({
  selector: 'app-donation-route',
  imports: [NgComponentOutlet],
  templateUrl: './donation-route.component.html',
  styleUrl: './donation-route.component.scss',
})
export class DonationRouteComponent {
  readonly donComponent = donationConfig.donation_component;
}
