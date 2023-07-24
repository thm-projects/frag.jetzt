import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';

declare let paypal;

@Component({
  selector: 'app-donation',
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.scss']
})

export class DonationComponent implements OnInit {
  paidFor = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  //Get InputElement From DOM
  @ViewChild('input') inputElement: ElementRef;
  //Get PaypalButton Element from DOM
  @ViewChild('paypalButtons', {static: true}) paypalButtonsElement: ElementRef;

  ngOnInit(): void {
    paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: 'EUR',
                  value: this.inputElement.nativeElement.value,
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
