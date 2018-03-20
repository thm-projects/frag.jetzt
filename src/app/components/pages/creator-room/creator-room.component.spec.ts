import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorRoomComponent } from './creator-room.component';

describe('CreatorRoomComponent', () => {
  let component: CreatorRoomComponent;
  let fixture: ComponentFixture<CreatorRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatorRoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
