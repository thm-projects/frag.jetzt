import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomCreationComponent } from './room-creation.component';

describe('RoomCreationComponent', () => {
  let component: RoomCreationComponent;
  let fixture: ComponentFixture<RoomCreationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomCreationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
