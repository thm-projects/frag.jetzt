import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownHelpDialogComponent } from './markdown-help-dialog.component';

describe('MarkdownHelpDialogComponent', () => {
  let component: MarkdownHelpDialogComponent;
  let fixture: ComponentFixture<MarkdownHelpDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkdownHelpDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownHelpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
