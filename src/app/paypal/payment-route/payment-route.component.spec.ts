import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentRouteComponent } from './payment-route.component';

describe('PaymentRouteComponent', () => {
  let component: PaymentRouteComponent;
  let fixture: ComponentFixture<PaymentRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentRouteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
