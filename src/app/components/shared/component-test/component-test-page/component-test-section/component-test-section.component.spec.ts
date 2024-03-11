import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestSectionComponent } from './component-test-section.component';

describe('ComponentTestSectionComponent', () => {
  let component: ComponentTestSectionComponent;
  let fixture: ComponentFixture<ComponentTestSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
