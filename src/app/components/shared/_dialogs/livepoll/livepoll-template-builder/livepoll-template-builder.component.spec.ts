import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollTemplateBuilderComponent } from './livepoll-template-builder.component';

describe('LivepollTemplateBuilderComponent', () => {
  let component: LivepollTemplateBuilderComponent;
  let fixture: ComponentFixture<LivepollTemplateBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollTemplateBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollTemplateBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
