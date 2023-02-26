import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollVoteComponent } from './livepoll-vote.component';

describe('LivepollVoteComponent', () => {
  let component: LivepollVoteComponent;
  let fixture: ComponentFixture<LivepollVoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivepollVoteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivepollVoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
