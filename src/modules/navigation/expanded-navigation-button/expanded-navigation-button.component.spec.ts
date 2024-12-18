import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedNavigationButtonComponent } from './expanded-navigation-button.component';

describe('ExpandedNavigationButtonComponent', () => {
  let component: ExpandedNavigationButtonComponent;
  let fixture: ComponentFixture<ExpandedNavigationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandedNavigationButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpandedNavigationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
