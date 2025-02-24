import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3NavDrawerRailComponent } from './m3-nav-drawer-rail.component';

describe('M3NavDrawerRailComponent', () => {
  let component: M3NavDrawerRailComponent;
  let fixture: ComponentFixture<M3NavDrawerRailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3NavDrawerRailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3NavDrawerRailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
