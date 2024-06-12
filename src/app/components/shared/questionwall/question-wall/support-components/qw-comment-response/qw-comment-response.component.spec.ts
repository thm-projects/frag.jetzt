import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentResponseComponent } from './qw-comment-response.component';

describe('QwCommentAnswerComponent', () => {
  let component: QwCommentResponseComponent;
  let fixture: ComponentFixture<QwCommentResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentResponseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
