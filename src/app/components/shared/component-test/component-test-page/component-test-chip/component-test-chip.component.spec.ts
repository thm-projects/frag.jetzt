import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestChipComponent } from './component-test-chip.component';

describe('ComponentTestChipComponent', () => {
  let component: ComponentTestChipComponent;
  let fixture: ComponentFixture<ComponentTestChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
