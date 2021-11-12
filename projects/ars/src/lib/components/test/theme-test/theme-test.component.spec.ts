import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ThemeTestComponent } from './theme-test.component';

describe('ThemeTestComponent', () => {
  let component: ThemeTestComponent;
  let fixture: ComponentFixture<ThemeTestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ThemeTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
