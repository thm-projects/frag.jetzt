import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallDrawerCommentComponent } from './question-wall-drawer-comment.component';

describe('QuestionWallDrawerCommentComponent', () => {
  let component: QuestionWallDrawerCommentComponent;
  let fixture: ComponentFixture<QuestionWallDrawerCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallDrawerCommentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallDrawerCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
