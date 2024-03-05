import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownViewerComponent } from './markdown-viewer.component';

describe('MarkdownViewerComponent', () => {
  let component: MarkdownViewerComponent;
  let fixture: ComponentFixture<MarkdownViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarkdownViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
