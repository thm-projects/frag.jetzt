import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3SupportingPaneComponent } from './m3-supporting-pane.component';

describe('M3PrimarySupportingPaneComponent', () => {
  let component: M3SupportingPaneComponent;
  let fixture: ComponentFixture<M3SupportingPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3SupportingPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3SupportingPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
