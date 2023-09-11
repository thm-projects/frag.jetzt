import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollPeerInstructionWindowComponent } from './livepoll-peer-instruction-window.component';

describe('LivepollPeerInstructionWindowComponent', () => {
  let component: LivepollPeerInstructionWindowComponent;
  let fixture: ComponentFixture<LivepollPeerInstructionWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollPeerInstructionWindowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollPeerInstructionWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
