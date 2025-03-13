import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap } from 'rxjs';
import { Language } from 'app/base/language/language';
import { BaseHttpService } from 'app/services/http/base-http.service';

// Define an interface for the response of creating an order
interface CreateOrderResponse {
  id: string;
  status: string;
  // Add any additional fields that you expect in the response
}

// Define an interface for capturing an order response
interface CaptureOrderResponse {
  id: string;
  status: string;
  // Add any additional fields that you expect in the response
}

interface CapturedQuota {
  token: number;
}

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  createOrder(
    price: number,
    currency: 'EUR',
    language: Language,
  ): Observable<CreateOrderResponse> {
    if (price <= 0) {
      throw new Error('Price must be greater than zero.');
    }
    const url = '/api/paypal/create-order/';
    return this.http
      .post<CreateOrderResponse>(
        url,
        {
          amount: price,
          currency,
          language,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<CreateOrderResponse>('createOrder')),
      );
  }

  captureOrder(orderId: string): Observable<CaptureOrderResponse> {
    const url = `/api/paypal/capture-order/${orderId}/`;
    return this.http
      .post<CaptureOrderResponse>(url, undefined, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<CaptureOrderResponse>('captureOrder')),
      );
  }

  getCapturedQuota(): Observable<CapturedQuota> {
    const url = '/api/paypal/captured-quota/';
    return this.http.get<CapturedQuota>(url, httpOptions).pipe(
      tap(() => ''),
      map((response) => {
        response.token = this.parseTokens(response['amount']);
        delete response['amount'];
        return response;
      }),
      catchError(this.handleError<CapturedQuota>('getCapturedQuota')),
    );
  }

  private parseTokens(amount: string): number {
    const index = amount.indexOf('.');
    amount =
      amount.substring(0, index) + amount.substring(index + 1, index + 3);
    const v = (BigInt(amount) * 10_000n) / 15n; // Per 1 million token, but divided by 100 for cents, 15 is the price for 1M token
    return Number(v);
  }
}
