import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3NavDrawerComponent } from './m3-nav-drawer.component';

describe('M3NavDrawerComponent', () => {
  let component: M3NavDrawerComponent;
  let fixture: ComponentFixture<M3NavDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3NavDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3NavDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
