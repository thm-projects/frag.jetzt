import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestCardComponent } from './component-test-card.component';

describe('ComponentTestCardComponent', () => {
  let component: ComponentTestCardComponent;
  let fixture: ComponentFixture<ComponentTestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
