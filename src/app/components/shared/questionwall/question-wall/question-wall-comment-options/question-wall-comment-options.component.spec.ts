import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallCommentOptionsComponent } from './question-wall-comment-options.component';

describe('QuestionWallCommentOptionsComponent', () => {
  let component: QuestionWallCommentOptionsComponent;
  let fixture: ComponentFixture<QuestionWallCommentOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallCommentOptionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallCommentOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
