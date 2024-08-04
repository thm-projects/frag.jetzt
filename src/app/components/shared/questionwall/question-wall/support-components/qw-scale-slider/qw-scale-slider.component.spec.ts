import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwScaleSliderComponent } from './qw-scale-slider.component';

describe('QwScaleSliderComponent', () => {
  let component: QwScaleSliderComponent;
  let fixture: ComponentFixture<QwScaleSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwScaleSliderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwScaleSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
