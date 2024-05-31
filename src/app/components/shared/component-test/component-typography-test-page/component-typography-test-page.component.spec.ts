import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTypographyTestPageComponent } from './component-typography-test-page.component';

describe('ComponentTypographyTestPageComponent', () => {
  let component: ComponentTypographyTestPageComponent;
  let fixture: ComponentFixture<ComponentTypographyTestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTypographyTestPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTypographyTestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
