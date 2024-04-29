import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3LabelComponent } from './m3-label.component';

describe('M3LabelComponent', () => {
  let component: M3LabelComponent;
  let fixture: ComponentFixture<M3LabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3LabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3LabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
