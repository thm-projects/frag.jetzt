import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GPTChatRoomComponent } from './gptchat-room.component';

describe('GPTChatRoomComponent', () => {
  let component: GPTChatRoomComponent;
  let fixture: ComponentFixture<GPTChatRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GPTChatRoomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GPTChatRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
