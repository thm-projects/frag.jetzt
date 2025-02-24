import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantChatComponent } from './assistant-chat.component';

describe('AssistantChatComponent', () => {
  let component: AssistantChatComponent;
  let fixture: ComponentFixture<AssistantChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantChatComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
