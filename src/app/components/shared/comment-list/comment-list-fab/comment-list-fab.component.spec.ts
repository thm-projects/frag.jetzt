import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentListFabComponent } from './comment-list-fab.component';

describe('CommentListFabComponent', () => {
  let component: CommentListFabComponent;
  let fixture: ComponentFixture<CommentListFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentListFabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentListFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
