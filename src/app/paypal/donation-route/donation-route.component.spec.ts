import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationRouteComponent } from './donation-route.component';

describe('DonationRouteComponent', () => {
  let component: DonationRouteComponent;
  let fixture: ComponentFixture<DonationRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonationRouteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonationRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
