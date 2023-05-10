import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollLiveIndicatorComponent } from './livepoll-live-indicator.component';

describe('LivepollLiveIndicatorComponent', () => {
  let component: LivepollLiveIndicatorComponent;
  let fixture: ComponentFixture<LivepollLiveIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollLiveIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollLiveIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
