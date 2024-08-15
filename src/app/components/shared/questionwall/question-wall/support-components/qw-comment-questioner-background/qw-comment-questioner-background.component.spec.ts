import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentQuestionerBackgroundComponent } from './qw-comment-questioner-background.component';

describe('QwCommentQuestionerBackgroundComponent', () => {
  let component: QwCommentQuestionerBackgroundComponent;
  let fixture: ComponentFixture<QwCommentQuestionerBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentQuestionerBackgroundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentQuestionerBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
