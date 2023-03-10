import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GptRatingComponent } from './gpt-rating.component';

describe('GptRatingComponent', () => {
  let component: GptRatingComponent;
  let fixture: ComponentFixture<GptRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GptRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GptRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
