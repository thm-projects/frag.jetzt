import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLandingPageComponent } from './error-landing-page.component';

describe('ErrorLandingPageComponent', () => {
  let component: ErrorLandingPageComponent;
  let fixture: ComponentFixture<ErrorLandingPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorLandingPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
