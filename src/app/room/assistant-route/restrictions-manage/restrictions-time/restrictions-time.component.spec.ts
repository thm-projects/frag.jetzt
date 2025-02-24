import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsTimeComponent } from './restrictions-time.component';

describe('RestrictionsTimeComponent', () => {
  let component: RestrictionsTimeComponent;
  let fixture: ComponentFixture<RestrictionsTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestrictionsTimeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RestrictionsTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
