import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestPageComponent } from './component-test-page.component';

describe('ComponentTestPageComponent', () => {
  let component: ComponentTestPageComponent;
  let fixture: ComponentFixture<ComponentTestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
