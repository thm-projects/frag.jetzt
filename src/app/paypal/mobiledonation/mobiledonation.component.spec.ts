import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobiledonationComponent } from './mobiledonation.component';

describe('MobiledonationComponent', () => {
  let component: MobiledonationComponent;
  let fixture: ComponentFixture<MobiledonationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobiledonationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobiledonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
