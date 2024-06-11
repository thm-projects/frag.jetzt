import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentComponent } from './qw-comment.component';

describe('QuestionWallCommentComponent', () => {
  let component: QwCommentComponent;
  let fixture: ComponentFixture<QwCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
