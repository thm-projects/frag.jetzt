import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a PayPal order', waitForAsync(() => {
    const mockOrderResponse = { id: 'ORDER123', status: 'CREATED' };

    service.createOrder(15, 'EUR', 'en').subscribe((response) => {
      expect(response).toEqual(mockOrderResponse);
    });

    const req = httpMock.expectOne('/api/paypal/create-order/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      amount: 15,
      currency: 'EUR',
      language: 'en',
    });
    req.flush(mockOrderResponse);
  }));

  it('should throw error for invalid price', () => {
    expect(() => service.createOrder(0, 'EUR', 'en')).toThrow(
      new Error('Price must be greater than zero.'),
    );

    expect(() => service.createOrder(-5, 'EUR', 'en')).toThrow(
      new Error('Price must be greater than zero.'),
    );
  });

  it('should capture an order', waitForAsync(() => {
    const mockCaptureResponse = { id: 'ORDER123', status: 'COMPLETED' };
    const orderId = 'ORDER123';

    service.captureOrder(orderId).subscribe((response) => {
      expect(response).toEqual(mockCaptureResponse);
    });

    const req = httpMock.expectOne(`/api/paypal/capture-order/${orderId}/`);
    expect(req.request.method).toBe('POST');
    req.flush(mockCaptureResponse);
  }));

  it('should get captured quota', waitForAsync(() => {
    const mockQuotaResponse = { amount: '15.00', user: 'user123' };
    const expectedResponse = { token: 1000000, user: 'user123' };

    service.getCapturedQuota().subscribe((response) => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne('/api/paypal/captured-quota/');
    expect(req.request.method).toBe('GET');
    req.flush(mockQuotaResponse);
  }));

  it('should correctly parse tokens from amount', waitForAsync(() => {
    service.getCapturedQuota().subscribe((response) => {
      expect(response.token).toBe(1000000);
    });

    const req = httpMock.expectOne('/api/paypal/captured-quota/');
    req.flush({ amount: '15.00' });
  }));
});
