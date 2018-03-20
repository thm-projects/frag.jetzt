import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeParticipantComponent } from './home-participant.component';

describe('HomeParticipantComponent', () => {
  let component: HomeParticipantComponent;
  let fixture: ComponentFixture<HomeParticipantComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeParticipantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeParticipantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
