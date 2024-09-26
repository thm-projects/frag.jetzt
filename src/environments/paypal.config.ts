/* import { PaymentComponent } from 'app/paypal/payment/payment.component';

export const paymentConfig = {
  payment_component: PaymentComponent,
}; */

/* import { DonationComponent } from 'app/paypal/donation/donation.component';

export const donationConfig = {
  payment_component: DonationComponent,

} */

import { MobileComponent } from 'app/paypal/mobile/mobile.component';
import { MobiledonationComponent } from 'app/paypal/mobiledonation/mobiledonation.component';

export const paymentConfig = {
  payment_component: MobileComponent,
};

export const donationConfig = {
  donation_component: MobiledonationComponent,
};
