import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureGridDialogComponent } from './feature-grid-dialog.component';

describe('FeatureGridDialogComponent', () => {
  let component: FeatureGridDialogComponent;
  let fixture: ComponentFixture<FeatureGridDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureGridDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureGridDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
