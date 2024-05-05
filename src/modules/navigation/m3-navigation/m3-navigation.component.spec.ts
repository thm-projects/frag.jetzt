import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3NavigationComponent } from './m3-navigation.component';

describe('M3NavigationComponent', () => {
  let component: M3NavigationComponent;
  let fixture: ComponentFixture<M3NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3NavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
