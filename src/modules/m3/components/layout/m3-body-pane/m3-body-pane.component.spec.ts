import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3BodyPaneComponent } from './m3-body-pane.component';

describe('M3LayoutBodyPaneComponent', () => {
  let component: M3BodyPaneComponent;
  let fixture: ComponentFixture<M3BodyPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3BodyPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3BodyPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
