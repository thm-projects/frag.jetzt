import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDeletionComponent } from './room-delete.component';

describe('RoomDeletionComponent', () => {
  let component: RoomDeletionComponent;
  let fixture: ComponentFixture<RoomDeletionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomDeletionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomDeletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
