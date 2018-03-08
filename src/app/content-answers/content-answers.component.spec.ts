import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentAnswersComponent } from './content-answers.component';

describe('ContentAnswersComponent', () => {
  let component: ContentAnswersComponent;
  let fixture: ComponentFixture<ContentAnswersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentAnswersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentAnswersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
