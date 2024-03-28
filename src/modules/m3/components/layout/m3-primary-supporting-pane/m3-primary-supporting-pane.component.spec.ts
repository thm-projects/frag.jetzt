import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3PrimarySupportingPaneComponent } from './m3-primary-supporting-pane.component';

describe('M3PrimarySupportingPaneComponent', () => {
  let component: M3PrimarySupportingPaneComponent;
  let fixture: ComponentFixture<M3PrimarySupportingPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3PrimarySupportingPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3PrimarySupportingPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
