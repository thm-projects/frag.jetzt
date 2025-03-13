import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentResponseWindowComponent } from './qw-comment-response-window.component';

describe('QwCommentResponseWindowComponent', () => {
  let component: QwCommentResponseWindowComponent;
  let fixture: ComponentFixture<QwCommentResponseWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentResponseWindowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentResponseWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
