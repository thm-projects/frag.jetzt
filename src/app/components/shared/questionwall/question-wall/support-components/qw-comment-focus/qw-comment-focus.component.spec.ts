import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentFocusComponent } from './qw-comment-focus.component';

describe('QuestionWallCommentFocusComponent', () => {
  let component: QwCommentFocusComponent;
  let fixture: ComponentFixture<QwCommentFocusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentFocusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentFocusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
