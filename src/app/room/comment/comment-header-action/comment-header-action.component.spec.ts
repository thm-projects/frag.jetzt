import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentHeaderActionComponent } from './comment-header-action.component';

describe('CommentHeaderActionComponent', () => {
  let component: CommentHeaderActionComponent;
  let fixture: ComponentFixture<CommentHeaderActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentHeaderActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentHeaderActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
