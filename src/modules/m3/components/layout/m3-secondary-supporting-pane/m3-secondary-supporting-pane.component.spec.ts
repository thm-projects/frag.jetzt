import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3SecondarySupportingPaneComponent } from './m3-secondary-supporting-pane.component';

describe('M3SecondarySupportingPaneComponent', () => {
  let component: M3SecondarySupportingPaneComponent;
  let fixture: ComponentFixture<M3SecondarySupportingPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3SecondarySupportingPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3SecondarySupportingPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
