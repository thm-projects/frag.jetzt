import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinRoomComponent } from './room-join.component';

describe('JoinRoomComponent', () => {
  let component: JoinRoomComponent;
  let fixture: ComponentFixture<JoinRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinRoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
