import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private paypalApiUrl = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
  private clientId =
    'ATZFarfzWZCA0DB05S_7xGNEx7Gz_d_KAl7BkJwgaKBZgfpptY-mVw7jv0z9ctTHq92axuaQiPKg9xAu';
  private clientSecret =
    'ELT7A8oH6oPX1dHT5qhV11H1A-4Zl4VHX2DoROMxj77EuBY_d3smWPDUe_7cQqNw_T95jxTky7TgHlcV';

  constructor(private http: HttpClient) {}

  // Retrieves an OAuth 2.0 access token from PayPal.
  private getAuthToken(): Observable<string> {
    const tokenUrl = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
    });
    const body = 'grant_type=client_credentials';

    return this.http
      .post<{ access_token: string }>(tokenUrl, body, { headers })
      .pipe(map((response) => response.access_token));
  }

  // Creates an order for a single token purchase
  createOrder(tokenAmount: number): Observable<CreateOrderResponse> {
    // Ensure the token amount is valid
    if (tokenAmount <= 0) {
      throw new Error('Token amount must be greater than zero.');
    }

    return this.getAuthToken().pipe(
      switchMap((accessToken) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

        const total = this.calculateTokenPrice(tokenAmount);
        const body = {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: `PU_${Date.now()}`,
              amount: {
                currency_code: 'EUR',
                value: total.toFixed(2),
              },
              items: [
                {
                  name: `${tokenAmount} Tokens`, // Display the number of tokens purchased
                  unit_amount: {
                    currency_code: 'EUR',
                    value: total.toFixed(2),
                  },
                  quantity: '1', // Only 1 token per purchase
                },
              ],
            },
          ],
          application_context: {
            brand_name: 'Token Shop',
            user_action: 'PAY_NOW',
          },
        };

        return this.http.post<CreateOrderResponse>(this.paypalApiUrl, body, {
          headers,
        });
      }),
    );
  }

  // Capture the order after approval
  captureOrder(orderId: string): Observable<CaptureOrderResponse> {
    return this.getAuthToken().pipe(
      switchMap((accessToken) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

        const captureUrl = `${this.paypalApiUrl}/${orderId}/capture`;

        return this.http.post<CaptureOrderResponse>(
          captureUrl,
          {},
          { headers },
        );
      }),
    );
  }

  // Helper function to determine price based on token amount
  private calculateTokenPrice(tokenAmount: number): number {
    switch (tokenAmount) {
      case 50000:
        return 5; // €5 Plan
      case 106000:
        return 10; // €10 Plan
      case 212000:
        return 20; // €20 Plan
      case 530000:
        return 50; // €50 Plan
      default:
        throw new Error('Invalid token amount');
    }
  }
}
