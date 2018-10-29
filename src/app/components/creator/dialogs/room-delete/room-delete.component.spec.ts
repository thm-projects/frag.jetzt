import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDeleteComponent } from './room-delete.component';

describe('RoomDeleteComponent', () => {
  let component: RoomDeleteComponent;
  let fixture: ComponentFixture<RoomDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
