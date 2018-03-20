import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerStatisticsComponent } from './statistics.component';

describe('AnswerStatisticsComponent', () => {
  let component: AnswerStatisticsComponent;
  let fixture: ComponentFixture<AnswerStatisticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnswerStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
