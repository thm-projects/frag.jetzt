import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivePollComponent } from './live-poll.component';

describe('LivePollComponent', () => {
  let component: LivePollComponent;
  let fixture: ComponentFixture<LivePollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivePollComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LivePollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
