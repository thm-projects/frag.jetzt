import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsQuotaComponent } from './restrictions-quota.component';

describe('RestrictionsQuotaComponent', () => {
  let component: RestrictionsQuotaComponent;
  let fixture: ComponentFixture<RestrictionsQuotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestrictionsQuotaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RestrictionsQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
