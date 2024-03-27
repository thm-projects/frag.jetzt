import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3NavPaneComponent } from './m3-nav-pane.component';

describe('M3NavPaneComponent', () => {
  let component: M3NavPaneComponent;
  let fixture: ComponentFixture<M3NavPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3NavPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3NavPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
