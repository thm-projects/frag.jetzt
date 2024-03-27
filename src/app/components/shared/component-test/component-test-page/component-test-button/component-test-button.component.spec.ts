import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestButtonComponent } from './component-test-button.component';

describe('ComponentTestButtonComponent', () => {
  let component: ComponentTestButtonComponent;
  let fixture: ComponentFixture<ComponentTestButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
