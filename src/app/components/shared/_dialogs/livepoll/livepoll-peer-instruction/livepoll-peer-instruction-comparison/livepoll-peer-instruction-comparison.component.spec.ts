import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollPeerInstructionComparisonComponent } from './livepoll-peer-instruction-comparison.component';

describe('LivepollPeerInstructionComparisonComponent', () => {
  let component: LivepollPeerInstructionComparisonComponent;
  let fixture: ComponentFixture<LivepollPeerInstructionComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollPeerInstructionComparisonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      LivepollPeerInstructionComparisonComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
