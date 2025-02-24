import { ComponentFixture, TestBed } from '@angular/core/testing';

import { APISetupComponent } from './apisetup.component';

describe('APISetupComponent', () => {
  let component: APISetupComponent;
  let fixture: ComponentFixture<APISetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [APISetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(APISetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
