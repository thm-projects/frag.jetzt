import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitCommentComponent } from './submit-comment.component';

describe('SubmitCommentComponent', () => {
  let component: SubmitCommentComponent;
  let fixture: ComponentFixture<SubmitCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmitCommentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
