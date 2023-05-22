import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollBarChartComponent } from './livepoll-bar-chart.component';

describe('LivepollBarChartComponent', () => {
  let component: LivepollBarChartComponent;
  let fixture: ComponentFixture<LivepollBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollBarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
