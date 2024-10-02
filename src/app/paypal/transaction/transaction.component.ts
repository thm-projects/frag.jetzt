import { DecimalPipe } from '@angular/common';
import { Component, inject, Injector, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';

class Transaction {
  id: number;
  currency: Currency;
  price: number;
  tokens: number;
  date: Date;

  constructor(
    id: number,
    currency: Currency,
    price: number,
    tokens: number,
    date: Date,
  ) {
    this.id = id;
    this.currency = currency;
    this.tokens = tokens;
    this.price = price;
    this.date = date;
  }
}

enum Currency {
  EURO = 'Euro',
  DOLLAR = 'Dollar',
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [MatIconModule, MatListModule, MatCardModule, DecimalPipe],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss',
})
export class TransactionComponent implements OnInit {
  private injector = inject(Injector);
  transactions: Transaction[] = [];

  constructor() {
    applyDefaultNavigation(this.injector).subscribe();
  }

  ngOnInit(): void {
    // TODO load transactions apicall
    this.transactions = [
      new Transaction(1, Currency.EURO, 10, 1_000_000, new Date()),
      new Transaction(1, Currency.EURO, 5, 1_000_000, new Date()),
      new Transaction(1, Currency.DOLLAR, 12, 1_000_000, new Date()),
    ];
  }

  mapCurrencyToIcon(currency: Currency): string {
    console.log(currency);

    switch (currency) {
      case Currency.EURO:
        return 'euro';
      case Currency.DOLLAR:
        return 'attach_money';
      default:
        return 'euro';
    }
  }

  currencyString(currency: Currency): string {
    switch (currency) {
      case Currency.EURO:
        return 'Euro';
      case Currency.DOLLAR:
        return 'Dollar';
      default:
        return 'Euro';
    }
  }

  totalPrice(): number {
    return this.transactions
      .map((x) => x.price)
      .reduce((prev, curr) => prev + curr);
  }
  totalToken(): number {
    return this.transactions
      .map((x) => x.tokens)
      .reduce((prev, curr) => prev + curr);
  }
}
