import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3NavRailComponent } from './m3-nav-rail.component';

describe('M3NavRailComponent', () => {
  let component: M3NavRailComponent;
  let fixture: ComponentFixture<M3NavRailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3NavRailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3NavRailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
