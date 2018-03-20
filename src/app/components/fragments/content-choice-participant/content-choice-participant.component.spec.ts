import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantChoiceContentComponent } from './content-choice-participant.component';

describe('ParticipantChoiceContentComponent', () => {
  let component: ParticipantChoiceContentComponent;
  let fixture: ComponentFixture<ParticipantChoiceContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantChoiceContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantChoiceContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
