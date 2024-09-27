import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaypalDialogComponent } from './paypal-dialog.component';

describe('PaypalDialogComponent', () => {
  let component: PaypalDialogComponent;
  let fixture: ComponentFixture<PaypalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaypalDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaypalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
