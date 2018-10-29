import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownToolbarComponent } from './markdown-toolbar.component';

describe('MarkdownToolbarComponent', () => {
  let component: MarkdownToolbarComponent;
  let fixture: ComponentFixture<MarkdownToolbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkdownToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
