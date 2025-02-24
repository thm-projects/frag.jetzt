import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestSubSectionComponent } from './component-test-sub-section.component';

describe('ComponentTestSubSectionComponent', () => {
  let component: ComponentTestSubSectionComponent;
  let fixture: ComponentFixture<ComponentTestSubSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestSubSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestSubSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
