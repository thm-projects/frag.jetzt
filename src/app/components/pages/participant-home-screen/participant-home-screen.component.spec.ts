import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantHomeScreenComponent } from './participant-home-screen.component';

describe('ParticipantHomeScreenComponent', () => {
  let component: ParticipantHomeScreenComponent;
  let fixture: ComponentFixture<ParticipantHomeScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantHomeScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantHomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
