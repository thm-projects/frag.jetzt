import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationComponent } from './donation.component';

describe('DonationComponent', () => {
  let component: DonationComponent;
  let fixture: ComponentFixture<DonationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DonationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
