import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactNavigationButtonComponent } from './compact-navigation-button.component';

describe('CompactNavigationButtonComponent', () => {
  let component: CompactNavigationButtonComponent;
  let fixture: ComponentFixture<CompactNavigationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompactNavigationButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompactNavigationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
