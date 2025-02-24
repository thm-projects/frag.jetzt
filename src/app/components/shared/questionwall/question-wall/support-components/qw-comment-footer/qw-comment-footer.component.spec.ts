import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwCommentFooterComponent } from './qw-comment-footer.component';

describe('QwCommentFooterComponent', () => {
  let component: QwCommentFooterComponent;
  let fixture: ComponentFixture<QwCommentFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwCommentFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwCommentFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
