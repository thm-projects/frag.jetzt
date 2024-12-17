import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomActivityComponent } from './room-activity.component';

describe('RoomActivityComponent', () => {
  let component: RoomActivityComponent;
  let fixture: ComponentFixture<RoomActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomActivityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
