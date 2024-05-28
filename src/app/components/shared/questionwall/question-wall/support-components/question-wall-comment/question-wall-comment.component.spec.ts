import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallCommentComponent } from './question-wall-comment.component';

describe('QuestionWallCommentComponent', () => {
  let component: QuestionWallCommentComponent;
  let fixture: ComponentFixture<QuestionWallCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallCommentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
