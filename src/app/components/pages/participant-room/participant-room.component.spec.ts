import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantRoomComponent } from './participant-room.component';

describe('ParticipantRoomComponent', () => {
  let component: ParticipantRoomComponent;
  let fixture: ComponentFixture<ParticipantRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantRoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
