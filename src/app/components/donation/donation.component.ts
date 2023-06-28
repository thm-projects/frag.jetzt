import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

declare var paypal;

@Component({
  selector: 'app-donation',
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.scss']
})

export class DonationComponent implements OnInit {

  constructor() { }
  
  @Input() amount: string = '';

  product = {
    price: 777.77,
    description: 'used couch, decent condition',
    img: 'assets/couch.jpg'
  };

  paidFor = false;


  //Pass your ClientId + scret key
  @ViewChild('paypal', {static: true}) paypalElement: ElementRef;
  ngOnInit(): void {
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
      .render(this.paypalElement.nativeElement);
  }

}
