import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GptChatConfirmLeaveComponent } from './gpt-chat-confirm-leave.component';

describe('GptChatConfirmLeaveComponent', () => {
  let component: GptChatConfirmLeaveComponent;
  let fixture: ComponentFixture<GptChatConfirmLeaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GptChatConfirmLeaveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GptChatConfirmLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
