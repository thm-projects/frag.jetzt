import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationLabelComponent } from './navigation-label.component';

describe('NavigationLabelComponent', () => {
  let component: NavigationLabelComponent;
  let fixture: ComponentFixture<NavigationLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationLabelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
