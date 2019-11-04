import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArsSliderCombComponent } from './ars-slider-comb.component';

describe('ArsSliderCombComponent', () => {
  let component: ArsSliderCombComponent;
  let fixture: ComponentFixture<ArsSliderCombComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArsSliderCombComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArsSliderCombComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
