import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingWidgetComponent } from './spending-widget.component';

describe('SpendingWidgetComponent', () => {
  let component: SpendingWidgetComponent;
  let fixture: ComponentFixture<SpendingWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpendingWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
