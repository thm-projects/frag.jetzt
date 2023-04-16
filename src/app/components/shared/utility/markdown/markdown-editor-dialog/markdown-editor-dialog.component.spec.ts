import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownEditorDialogComponent } from './markdown-editor-dialog.component';

describe('MarkdownEditorDialogComponent', () => {
  let component: MarkdownEditorDialogComponent;
  let fixture: ComponentFixture<MarkdownEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarkdownEditorDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
