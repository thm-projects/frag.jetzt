import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeebackBarometerPageComponent } from './feeback-barometer-page.component';

describe('FeebackBarometerPageComponent', () => {
  let component: FeebackBarometerPageComponent;
  let fixture: ComponentFixture<FeebackBarometerPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeebackBarometerPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeebackBarometerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
