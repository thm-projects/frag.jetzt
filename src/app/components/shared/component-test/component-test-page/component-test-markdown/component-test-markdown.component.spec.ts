import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestMarkdownComponent } from './component-test-markdown.component';

describe('ComponentTestMarkdownComponent', () => {
  let component: ComponentTestMarkdownComponent;
  let fixture: ComponentFixture<ComponentTestMarkdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestMarkdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentTestMarkdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
