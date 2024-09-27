import { MobileComponent } from 'app/paypal/mobile/mobile.component';
import { MobiledonationComponent } from 'app/paypal/mobiledonation/mobiledonation.component';

export const paymentConfig = {
  payment_component: MobileComponent,
};

export const donationConfig = {
  donation_component: MobiledonationComponent,
};
