import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomParticipantComponent } from './room-participant.component';

describe('RoomParticipantComponent', () => {
  let component: RoomParticipantComponent;
  let fixture: ComponentFixture<RoomParticipantComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomParticipantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomParticipantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
