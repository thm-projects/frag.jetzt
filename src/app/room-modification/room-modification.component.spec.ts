import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomModificationComponent } from './room-modification.component';

describe('RoomModificationComponent', () => {
  let component: RoomModificationComponent;
  let fixture: ComponentFixture<RoomModificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomModificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomModificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
