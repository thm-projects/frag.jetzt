import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivePollEntryComponent } from './live-poll-entry.component';

describe('LivePollEntryComponent', () => {
  let component: LivePollEntryComponent;
  let fixture: ComponentFixture<LivePollEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivePollEntryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LivePollEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
