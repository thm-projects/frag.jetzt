import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';
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
}
