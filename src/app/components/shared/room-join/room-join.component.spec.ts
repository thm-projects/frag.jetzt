import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomJoinComponent } from './room-join.component';

describe('RoomJoinComponent', () => {
  let component: RoomJoinComponent;
  let fixture: ComponentFixture<RoomJoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomJoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomJoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
