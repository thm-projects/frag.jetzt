import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallCommentFocusComponent } from './question-wall-comment-focus.component';

describe('QuestionWallCommentFocusComponent', () => {
  let component: QuestionWallCommentFocusComponent;
  let fixture: ComponentFixture<QuestionWallCommentFocusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallCommentFocusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallCommentFocusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
