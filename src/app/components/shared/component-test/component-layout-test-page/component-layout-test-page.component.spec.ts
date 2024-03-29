import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentLayoutTestPageComponent } from './component-layout-test-page.component';

describe('ComponentLayoutTestPageComponent', () => {
  let component: ComponentLayoutTestPageComponent;
  let fixture: ComponentFixture<ComponentLayoutTestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentLayoutTestPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentLayoutTestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
