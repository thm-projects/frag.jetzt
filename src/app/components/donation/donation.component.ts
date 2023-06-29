import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';

declare var paypal;

@Component({
  selector: 'app-donation',
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.scss']
})

export class DonationComponent implements OnInit {


  product = {
    price: 777.77,
    description: 'donation'
  };

  paidFor = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  //Pass your ClientId + secret key
  @ViewChild('paypalButtons', {static: true}) paypalButtonsElement: ElementRef;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                description: this.product.description,
                amount: {
                  currency_code: 'USD',
                  value: this.product.price
                }
              }
            ]
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          this.paidFor = true;
          console.log(order);
        },
        onError: err => {
          console.log(err);
        }
      })
      .render(this.paypalButtonsElement.nativeElement);

    this.changeDetectorRef.detectChanges(); // Trigger change detection
  }
}
