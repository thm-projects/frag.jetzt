import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantTextContentComponent } from './content-text-participant.component';

describe('ParticipantTextContentComponent', () => {
  let component: ParticipantTextContentComponent;
  let fixture: ComponentFixture<ParticipantTextContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantTextContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantTextContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
