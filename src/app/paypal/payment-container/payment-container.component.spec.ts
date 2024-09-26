import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentContainerComponent } from './payment-container.component';

describe('PaymentContainerComponent', () => {
  let component: PaymentContainerComponent;
  let fixture: ComponentFixture<PaymentContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
