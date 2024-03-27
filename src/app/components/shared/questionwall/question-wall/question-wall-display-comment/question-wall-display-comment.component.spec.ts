import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallDisplayCommentComponent } from './question-wall-display-comment.component';

describe('QuestionWallDisplayCommentComponent', () => {
  let component: QuestionWallDisplayCommentComponent;
  let fixture: ComponentFixture<QuestionWallDisplayCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallDisplayCommentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallDisplayCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
