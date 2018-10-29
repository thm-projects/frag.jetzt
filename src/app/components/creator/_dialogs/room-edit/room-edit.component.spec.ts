import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomEditComponent } from './room-edit.component';

describe('RoomEditComponent', () => {
  let component: RoomEditComponent;
  let fixture: ComponentFixture<RoomEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
